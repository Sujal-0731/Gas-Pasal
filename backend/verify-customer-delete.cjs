// Phase 6.1 live verification for admin customer delete — run with the
// backend running: node verify-customer-delete.cjs
// Covers: 401 unauthenticated, 403 non-admin, 400 bad id, 404 unknown,
// 400 blocked-with-history (real customer, NO state change), 400 blocked-in-
// queue (real waiting customer, NO state change), 200 success path on a
// disposable customer. Success path is self-cleaning; blocked paths never
// modify anything.
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

const signFor = (u) => jwt.sign(
  { userId: u.id, username: u.username, role: u.role },
  process.env.JWT_SECRET, { expiresIn: '1h' }
);

async function main() {
  const { count: startCount } = await supabase.from('customers')
    .select('*', { count: 'exact', head: true });
  const { count: startQueue } = await supabase.from('queue')
    .select('*', { count: 'exact', head: true });
  const { data: admins } = await supabase.from('users').select('id, username, role')
    .eq('role', 'admin').eq('is_active', true).limit(1);
  const { data: others } = await supabase.from('users').select('id, username, role')
    .neq('role', 'admin').eq('is_active', true).limit(1);
  const adminToken = signFor(admins[0]);

  const del = async (id, token) => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(`${BASE}/admin/customers/${id}`, { method: 'DELETE', headers });
    let body = null;
    try { body = await res.json(); } catch { /* no body */ }
    return { status: res.status, body };
  };

  const UUID = '123e4567-e89b-12d3-a456-426614174000';

  // 1. authz + validation
  check('DELETE without token → 401', (await del(UUID, null)).status === 401);
  if (others && others.length) {
    check(`DELETE as non-admin (${others[0].role}) → 403`,
      (await del(UUID, signFor(others[0]))).status === 403);
  } else {
    console.log('SKIP  non-admin 403 check — no non-admin user');
  }
  check('DELETE malformed id → 400', (await del('not-a-uuid', adminToken)).status === 400);
  check('DELETE unknown customer → 404', (await del(UUID, adminToken)).status === 404);

  // 2. blocked: customer WITH transaction history (read-only check)
  const { data: txCustomer } = await supabase.from('transactions')
    .select('customer_id, customer_name').not('customer_id', 'is', null).limit(1);
  if (txCustomer && txCustomer.length) {
    const cid = txCustomer[0].customer_id;
    const { count: beforeCount } = await supabase.from('customers')
      .select('*', { count: 'exact', head: true });
    const r = await del(cid, adminToken);
    const { count: afterCount } = await supabase.from('customers')
      .select('*', { count: 'exact', head: true });
    const { data: stillThere } = await supabase.from('customers').select('id').eq('id', cid).maybeSingle();
    check('customer with history → 400 blocked (cascade protection)', r.status === 400,
      JSON.stringify(r.body && r.body.message));
    check('blocked attempt changed nothing', afterCount === beforeCount && !!stillThere,
      `customers ${beforeCount} → ${afterCount}`);
  } else {
    console.log('SKIP  history-block check — no transactions in DB');
  }

  // 3. blocked: customer waiting in the queue WITHOUT history — build a
  // disposable pair (temp customer + temp queue row) so the queue-specific
  // branch is genuinely exercised, then remove both.
  const { data: qCust, error: qErr } = await supabase.from('customers')
    .insert([{ customer_id: 'ZZ-QUEUETEST', name: 'ZZ Queue Test', phone: null, address: null, remarks: 'temp row — queue-block test' }])
    .select().single();
  if (qErr) { check('queue-test customer created', false, qErr.message); }
  else {
    const { data: qRow, error: qRowErr } = await supabase.from('queue')
      .insert([{
        customer_id: qCust.id, customer_name: qCust.name,
        empty_cylinder: 'कोही छैन', notes: 'temp queue row — delete test',
        status: 'waiting', queued_at: new Date().toISOString()
      }])
      .select().single();
    if (qRowErr) {
      check('queue-test row created', false, qRowErr.message);
    } else {
      const r = await del(qCust.id, adminToken);
      check('waiting-in-queue customer (no history) → 400 queue block',
        r.status === 400 && /क्यू/.test((r.body && r.body.message) || ''),
        JSON.stringify(r.body && r.body.message));
      const { data: stillThere } = await supabase.from('customers')
        .select('id').eq('id', qCust.id).maybeSingle();
      check('queued customer survives blocked attempt', !!stillThere);

      // cleanup the disposable pair
      await supabase.from('queue').delete().eq('id', qRow.id);
      await supabase.from('customers').delete().eq('id', qCust.id);
    }
  }

  // 4. success path: disposable customer with no history
  const { data: cust, error: cErr } = await supabase.from('customers')
    .insert([{ customer_id: 'ZZ-DELTEST', name: 'ZZ Delete Test', phone: null, address: null, remarks: 'temp row — delete endpoint test' }])
    .select().single();
  if (cErr) { check('temp customer created', false, cErr.message); }
  else {
    const r = await del(cust.id, adminToken);
    check('history-free customer → 200 deleted', r.status === 200 && r.body.success === true,
      JSON.stringify(r.body && r.body.message));
    const { data: gone } = await supabase.from('customers').select('id').eq('id', cust.id).maybeSingle();
    check('row actually removed from DB', gone === null);
  }

  const { count: finalCount } = await supabase.from('customers')
    .select('*', { count: 'exact', head: true });
  const { count: finalTx } = await supabase.from('transactions')
    .select('*', { count: 'exact', head: true });
  const { count: finalQueue } = await supabase.from('queue')
    .select('*', { count: 'exact', head: true });
  check('no leftovers: customer/queue counts match script start, transactions untouched',
    finalCount === startCount && finalQueue === startQueue && finalTx === 479,
    `customers ${startCount}→${finalCount}, queue ${startQueue}→${finalQueue}, transactions ${finalTx}`);

  const failed = results.filter(r => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  if (failed.length) process.exit(1);
}

main().catch(err => { console.error('FATAL', err); process.exit(1); });