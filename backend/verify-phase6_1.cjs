// Phase 6.1 live verification — run: node verify-phase6_1.cjs
// Exercises the real running API (settings GET/PUT/validation/authz) and a
// real payment recording flow, then restores ALL state it touched.
//
// All 479 existing transactions are legacy (total_amount NULL), so no payment
// can be recorded on real history without inventing money. The payment smoke
// therefore creates ONE disposable tracked transaction (+ temp customer), runs
// the payment flow against it through the API, verifies no sale/stock/queue
// side effects from payment recording, then deletes every row it created and
// restores the stock count it moved. Snapshots are asserted equal at the end.
// No mock balances are left behind. No dependencies added.
require('dotenv').config();
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');
const { resolveDefaultPrice } = require('./utils/settingsLogic');

const BASE = `http://localhost:${process.env.PORT || 5000}/api`;
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);
};

const authHeaders = (token) => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token}`
});

async function getToken() {
  const username = process.env.LOGIN_USERNAME || process.env.ADMIN_USERNAME;
  const password = process.env.LOGIN_PASSWORD || process.env.ADMIN_PASSWORD;
  if (username && password) {
    const res = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (data.success) {
      const cookie = res.headers.get('set-cookie') || '';
      const m = cookie.match(/auth_token=([^;]+)/);
      if (m) return m[1];
    }
  }
  // Fallback: sign a dev JWT for an existing admin user (same secret/claims
  // the real login issues; the role used by authorize() is read from the DB).
  const { data: users, error } = await supabase
    .from('users')
    .select('id, username, role')
    .eq('role', 'admin')
    .limit(1);
  if (error || !users || users.length === 0) {
    throw new Error('No admin user found and login credentials not provided');
  }
  const u = users[0];
  return jwt.sign(
    { userId: u.id, username: u.username, role: u.role },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
}

const snapshotWorld = async () => {
  const [{ count: txCount }, { count: payCount }, { count: queueCount }, { count: custCount }, stock] =
    await Promise.all([
      supabase.from('transactions').select('*', { count: 'exact', head: true }),
      supabase.from('payments').select('*', { count: 'exact', head: true }),
      supabase.from('queue').select('*', { count: 'exact', head: true }),
      supabase.from('customers').select('*', { count: 'exact', head: true }),
      supabase.from('stock').select('*').order('cylinder_type')
    ]);
  return { txCount, payCount, queueCount, custCount, stock: JSON.stringify(stock.data) };
};

async function settingsChecks(token) {
  const { data: baselineRow, error: baselineErr } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'default_price')
    .maybeSingle();

  const tableMissing = !!baselineErr && (
    baselineErr.code === '42P01'
    || baselineErr.code === 'PGRST205'
    || /settings/.test(baselineErr.message || '')
  );
  if (tableMissing) {
    check('settings table exists (migration applied)', false,
      'NOT RUN — run backend/migrations/phase6_1_settings.sql in the Supabase SQL editor, then re-run this script');
    return;
  }
  if (baselineErr) {
    check('settings table readable', false, baselineErr.message);
    return;
  }

  const hadRow = baselineRow !== null;
  const originalValue = hadRow ? baselineRow.value : undefined;
  const expectedFallback = resolveDefaultPrice(originalValue ?? null);

  const get1 = await (await fetch(`${BASE}/settings`, { headers: authHeaders(token) })).json();
  check('GET /api/settings (authenticated)', get1.success === true, JSON.stringify(get1));
  check('GET returns initial default 2060 when no row (or the saved value)',
    get1.settings && get1.settings.defaultPrice === expectedFallback,
    `got ${get1.settings && get1.settings.defaultPrice}, expected ${expectedFallback}`);

  const noAuth = await fetch(`${BASE}/settings`);
  check('GET without token → 401', noAuth.status === 401, `status ${noAuth.status}`);
  const noAuthPut = await fetch(`${BASE}/settings`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ defaultPrice: 2125 })
  });
  check('PUT without token → 401', noAuthPut.status === 401, `status ${noAuthPut.status}`);

  for (const bad of [0, -5, 10.5, 'abc', '']) {
    const r = await fetch(`${BASE}/settings`, {
      method: 'PUT', headers: authHeaders(token),
      body: JSON.stringify({ defaultPrice: bad })
    });
    check(`PUT invalid price ${JSON.stringify(bad)} → 400`, r.status === 400, `status ${r.status}`);
  }

  const { data: nonAdmin } = await supabase
    .from('users').select('id, username, role').neq('role', 'admin').limit(1);
  if (nonAdmin && nonAdmin.length > 0) {
    const nu = nonAdmin[0];
    const badToken = jwt.sign(
      { userId: nu.id, username: nu.username, role: nu.role },
      process.env.JWT_SECRET, { expiresIn: '1h' }
    );
    const r = await fetch(`${BASE}/settings`, {
      method: 'PUT', headers: authHeaders(badToken),
      body: JSON.stringify({ defaultPrice: 2125 })
    });
    check(`PUT as non-admin (${nu.role}) → 403`, r.status === 403, `status ${r.status}`);
  } else {
    console.log('SKIP  non-admin PUT 403 check — no non-admin user in DB');
  }

  const put = await (await fetch(`${BASE}/settings`, {
    method: 'PUT', headers: authHeaders(token),
    body: JSON.stringify({ defaultPrice: 2125 })
  })).json();
  check('PUT valid price 2125 → success', put.success === true, JSON.stringify(put));

  const get2 = await (await fetch(`${BASE}/settings`, { headers: authHeaders(token) })).json();
  check('GET reflects updated price', get2.settings && get2.settings.defaultPrice === 2125, JSON.stringify(get2.settings));

  const { data: dbRow } = await supabase.from('settings').select('value').eq('key', 'default_price').maybeSingle();
  check('DB row stores updated price (jsonb)', dbRow && dbRow.value === 2125, JSON.stringify(dbRow && dbRow.value));

  // ---- RESTORE original settings state --------------------------------
  if (hadRow) {
    const restore = await fetch(`${BASE}/settings`, {
      method: 'PUT', headers: authHeaders(token),
      body: JSON.stringify({ defaultPrice: originalValue })
    });
    check('RESTORED original settings value', restore.ok, `back to ${originalValue}`);
  } else {
    const { error: delErr } = await supabase.from('settings').delete().eq('key', 'default_price');
    const { data: afterDel } = await supabase.from('settings').select('value').eq('key', 'default_price').maybeSingle();
    check('RESTORED original settings state (no row — fallback 2060 applies again)',
      !delErr && afterDel === null, delErr ? delErr.message : 'row gone');
  }
}

async function paymentSmoke(token) {
  const before = await snapshotWorld();
  let createdCustomer = null;
  let createdTxId = null;
  let createdTxRowId = null;

  try {
    // 1. disposable customer + tracked transaction (partial payment)
    const { data: cust, error: custErr } = await supabase
      .from('customers')
      .insert([{ customer_id: 'ZZ-P61', name: 'ZZ Phase61 Verify', phone: null, address: null, remarks: 'temp row — Phase 6.1 live verification, deleted after test' }])
      .select()
      .single();
    if (custErr) throw custErr;
    createdCustomer = cust.id;

    const createRes = await fetch(`${BASE}/transactions`, {
      method: 'POST', headers: authHeaders(token),
      body: JSON.stringify({
        customerId: cust.id,
        customerName: cust.name,
        emptyCylinder: 'लोकप्रिय',
        filledCylinder: 'कोही छैन',
        remarks: 'phase6.1 verification',
        totalAmount: 2060,
        paidAmount: 500,
        paymentMode: 'cash'
      })
    });
    const createBody = await createRes.json();
    check('POST /api/transactions (return-only, Rs.2060 paid 500 cash)',
      createRes.ok && createBody.success === true, JSON.stringify(createBody.message || createBody));
    if (!createBody.success) return;
    createdTxRowId = createBody.data.id;
    createdTxId = createBody.data.transaction_id;

    // 2. derived summary on read: total/paid/balance/status from real rows
    const all = await (await fetch(`${BASE}/transactions/all?search=ZZ Phase61 Verify`, { headers: authHeaders(token) })).json();
    const row = (all.transactions || []).find(t => t.id === createdTxRowId);
    check('list derives total 2060 / paid 500 / balance 1560 / partial',
      row && row.total_amount === 2060 && row.total_paid === 500 && row.balance_due === 1560 && row.payment_status === 'partial',
      JSON.stringify(row && { t: row.total_amount, p: row.total_paid, b: row.balance_due, s: row.payment_status }));

    const pays1 = await (await fetch(`${BASE}/transactions/${createdTxRowId}/payments`, { headers: authHeaders(token) })).json();
    check('GET installments: 1 row, cash, Rs.500',
      pays1.success && pays1.payments.length === 1
      && pays1.payments[0].amount === 500 && pays1.payments[0].payment_mode === 'cash',
      JSON.stringify(pays1.payments && pays1.payments.map(p => [p.amount, p.payment_mode])));

    // 3. record second installment → payment must NOT touch sale/stock/queue
    const snapMid = await snapshotWorld();
    const payRes = await fetch(`${BASE}/transactions/${createdTxRowId}/payments`, {
      method: 'POST', headers: authHeaders(token),
      body: JSON.stringify({ amount: 1560, mode: 'online', note: 'phase6.1 verification' })
    });
    const payBody = await payRes.json();
    check('POST installment Rs.1560 online → success', payRes.ok && payBody.success === true, JSON.stringify(payBody));

    const snapAfterPay = await snapshotWorld();
    check('recording payment created no new sale', snapAfterPay.txCount === snapMid.txCount,
      `tx ${snapMid.txCount} → ${snapAfterPay.txCount}`);
    check('recording payment caused no stock movement', snapAfterPay.stock === snapMid.stock, 'stock identical');
    check('recording payment created no queue entry', snapAfterPay.queueCount === snapMid.queueCount,
      `queue ${snapMid.queueCount} → ${snapAfterPay.queueCount}`);

    const all2 = await (await fetch(`${BASE}/transactions/all?search=ZZ Phase61 Verify`, { headers: authHeaders(token) })).json();
    const row2 = (all2.transactions || []).find(t => t.id === createdTxRowId);
    check('after payment: paid 2060 / balance 0 / complete',
      row2 && row2.total_paid === 2060 && row2.balance_due === 0 && row2.payment_status === 'complete',
      JSON.stringify(row2 && { p: row2.total_paid, b: row2.balance_due, s: row2.payment_status }));

    const pays2 = await (await fetch(`${BASE}/transactions/${createdTxRowId}/payments`, { headers: authHeaders(token) })).json();
    check('installment history: 2 rows with both modes preserved',
      pays2.payments.length === 2
      && pays2.payments.some(p => p.payment_mode === 'cash')
      && pays2.payments.some(p => p.payment_mode === 'online'),
      JSON.stringify(pays2.payments.map(p => [p.amount, p.payment_mode])));

    // 4. overpay must be rejected atomically
    const over = await fetch(`${BASE}/transactions/${createdTxRowId}/payments`, {
      method: 'POST', headers: authHeaders(token),
      body: JSON.stringify({ amount: 1, mode: 'cash' })
    });
    check('overpayment rejected → 400', over.status === 400, `status ${over.status}`);
  } finally {
    // ---- FULL CLEANUP: remove everything this smoke created --------------
    if (createdTxRowId) {
      // FK payments.transaction_id ON DELETE CASCADE removes installments too
      const { error: txDel } = await supabase.from('transactions').delete().eq('id', createdTxRowId);
      if (txDel) console.log('CLEANUP ERROR (transaction):', txDel.message);
    }
    if (createdCustomer) {
      const { error: cDel } = await supabase.from('customers').delete().eq('id', createdCustomer);
      if (cDel) console.log('CLEANUP ERROR (customer):', cDel.message);
    }
    // restore stock the sale moved (return-only sale: लोकप्रिय empty +1)
    const { data: nowStock } = await supabase.from('stock').select('*').order('cylinder_type');
    const beforeStock = JSON.parse(before.stock);
    for (const b of beforeStock) {
      const n = (nowStock || []).find(s => s.id === b.id);
      if (n && (n.filled_count !== b.filled_count || n.empty_count !== b.empty_count || n.updated_at !== b.updated_at)) {
        await supabase.from('stock')
          .update({ filled_count: b.filled_count, empty_count: b.empty_count, updated_at: b.updated_at })
          .eq('id', b.id);
      }
    }
  }

  // ---- verify world is exactly as we found it --------------------------
  const final = await snapshotWorld();
  check('CLEANUP: transaction count restored', final.txCount === before.txCount,
    `${before.txCount} → ${final.txCount}`);
  check('CLEANUP: customer count restored', final.custCount === before.custCount,
    `${before.custCount} → ${final.custCount}`);
  check('CLEANUP: payments table back to original', final.payCount === before.payCount,
    `${before.payCount} → ${final.payCount}`);
  check('CLEANUP: queue untouched', final.queueCount === before.queueCount,
    `${before.queueCount} → ${final.queueCount}`);
  check('CLEANUP: stock identical to snapshot', final.stock === before.stock,
    final.stock === before.stock ? 'stock identical' : 'STOCK MISMATCH');
}

async function main() {
  const token = await getToken();
  console.log('Auth token obtained\n');

  await settingsChecks(token);
  console.log('');
  await paymentSmoke(token);

  const failed = results.filter(r => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  if (failed.length) {
    console.log('FAILED:');
    failed.forEach(f => console.log(`  - ${f.name} ${f.detail}`));
    process.exit(1);
  }
}

main().catch(err => { console.error('FATAL', err); process.exit(1); });