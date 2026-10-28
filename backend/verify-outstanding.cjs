// Phase 6.1 live verification for the Transactions outstanding=1 filter.
// Run with the backend running: node verify-outstanding.cjs
//
// All 479 real transactions are legacy (total_amount NULL) so the filter must
// return 0 for them. A disposable partial sale (Rs.2060, paid 500) proves the
// positive match, pagination, search combination and legacy exclusion, then
// is deleted — counts asserted equal to the script's start.
require('dotenv').config();
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');

const BASE = `http://localhost:${process.env.PORT || 5000}/api`;
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);
};

async function main() {
  const start = {
    customers: (await supabase.from('customers').select('*', { count: 'exact', head: true })).count,
    transactions: (await supabase.from('transactions').select('*', { count: 'exact', head: true })).count,
    payments: (await supabase.from('payments').select('*', { count: 'exact', head: true })).count
  };
  // the fixture sale moves stock (return-only: empty +1) — snapshot for restore
  const { data: stockBefore } = await supabase.from('stock').select('*').order('cylinder_type');
  const stockBeforeStr = JSON.stringify(stockBefore);

  const { data: admins } = await supabase.from('users').select('id, username, role')
    .eq('role', 'admin').limit(1);
  const u = admins[0];
  const token = jwt.sign({ userId: u.id, username: u.username, role: u.role },
    process.env.JWT_SECRET, { expiresIn: '1h' });
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const get = async (qs) => (await fetch(`${BASE}/transactions/all?${qs}`, { headers })).json();

  // 1. baseline: no due rows among the legacy data
  const before = await get('outstanding=1&limit=50');
  check('outstanding=1 returns only due rows (0 before fixture — all legacy)',
    before.success && before.pagination.totalItems === 0 && before.transactions.length === 0,
    `totalItems=${before.pagination && before.pagination.totalItems}`);

  // 2. build a disposable partial sale
  const { data: cust, error: cErr } = await supabase.from('customers')
    .insert([{ customer_id: 'ZZ-OUTSTANDING', name: 'ZZ Outstanding Test', phone: null, address: null, remarks: 'temp row — outstanding filter test' }])
    .select().single();
  if (cErr) { check('fixture customer created', false, cErr.message); return finish(start, stockBeforeStr); }

  const createRes = await fetch(`${BASE}/transactions`, {
    method: 'POST', headers,
    body: JSON.stringify({
      customerId: cust.id, customerName: cust.name,
      emptyCylinder: 'लोकप्रिय', filledCylinder: 'कोही छैन',
      remarks: 'outstanding filter test', totalAmount: 2060, paidAmount: 500, paymentMode: 'cash'
    })
  });
  const createBody = await createRes.json();
  check('fixture partial sale created (2060 / paid 500)', createBody.success === true,
    JSON.stringify(createBody.message || createBody));
  if (!createBody.success) return finish(start, stockBeforeStr);

  try {
    // 3. positive match + derivation
    const after = await get('outstanding=1&limit=50');
    const row = after.transactions.find(r => r.id === createBody.data.id);
    check('due row appears: totalItems 1 (legacy rows excluded)',
      after.pagination.totalItems === 1 && after.transactions.length === 1,
      `totalItems=${after.pagination.totalItems} of all rows`);
    check('row derived correctly: balance 1560 / partial',
      row && row.balance_due === 1560 && row.payment_status === 'partial' && row.total_paid === 500,
      JSON.stringify(row && { b: row.balance_due, s: row.payment_status, p: row.total_paid }));

    // 4. pagination over the filtered set
    const p2 = await get('outstanding=1&page=2&limit=20');
    check('page 2 of filtered set → empty page, totalItems still 1',
      p2.success && p2.transactions.length === 0 && p2.pagination.totalItems === 1
      && p2.pagination.totalPages === 1,
      JSON.stringify(p2.pagination));

    // 5. combined with search (matching + non-matching)
    const hit = await get(`outstanding=1&search=${encodeURIComponent(cust.name)}`);
    check('outstanding + matching search → 1', hit.pagination.totalItems === 1,
      `totalItems=${hit.pagination.totalItems}`);
    const miss = await get('outstanding=1&search=ZZNoSuchCustomerExists');
    check('outstanding + non-matching search → 0', miss.pagination.totalItems === 0,
      `totalItems=${miss.pagination.totalItems}`);

    // 6. unfiltered listing unaffected
    const plain = await get('limit=5');
    check('normal listing unaffected (totalItems counts all rows incl. legacy)',
      plain.success && plain.pagination.totalItems === start.transactions + 1,
      `totalItems=${plain.pagination.totalItems}`);

    // 7. CSV export shape: same filter with limit=10000
    const exportView = await get('outstanding=1&limit=10000');
    check('export-style query returns the due row',
      exportView.transactions.length === 1 && exportView.transactions[0].id === createBody.data.id,
      `${exportView.transactions.length} rows`);
  } finally {
    // ---- FULL CLEANUP ----
    await supabase.from('transactions').delete().eq('id', createBody.data.id);
    await supabase.from('customers').delete().eq('id', cust.id);
  }
  return finish(start, stockBeforeStr);
}

async function finish(start, stockBeforeStr) {
  // restore any stock the fixture sale moved (counts + updated_at)
  if (stockBeforeStr) {
    const before = JSON.parse(stockBeforeStr);
    const { data: stockNow } = await supabase.from('stock').select('*').order('cylinder_type');
    for (const b of before) {
      const n = (stockNow || []).find(s => s.id === b.id);
      if (n && (n.filled_count !== b.filled_count || n.empty_count !== b.empty_count || n.updated_at !== b.updated_at)) {
        await supabase.from('stock').update({
          filled_count: b.filled_count, empty_count: b.empty_count, updated_at: b.updated_at
        }).eq('id', b.id);
      }
    }
  }

  const now = {
    customers: (await supabase.from('customers').select('*', { count: 'exact', head: true })).count,
    transactions: (await supabase.from('transactions').select('*', { count: 'exact', head: true })).count,
    payments: (await supabase.from('payments').select('*', { count: 'exact', head: true })).count
  };
  const { data: stockFinal } = await supabase.from('stock').select('*').order('cylinder_type');
  check('CLEANUP: DB counts match script start',
    now.customers === start.customers && now.transactions === start.transactions && now.payments === start.payments,
    JSON.stringify({ start, now }));
  check('CLEANUP: stock identical to snapshot',
    JSON.stringify(stockFinal) === stockBeforeStr, 'stock restored');

  const failed = results.filter(r => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  if (failed.length) process.exit(1);
}

main().catch(err => { console.error('FATAL', err); process.exit(1); });