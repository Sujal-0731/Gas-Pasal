// Phase 6 unit tests — run with: npm test  (node --test tests/)
// Uses only Node's built-in test runner: no dependencies added.
const test = require('node:test');
const assert = require('node:assert/strict');

const { parseRupees, derivePaymentStatus, computeBalanceDue, isValidPaymentMode, PAYMENT_MODES } = require('../utils/paymentLogic');
const {
  validateTransactionInput,
  validatePaymentInput,
  validateTransactionIdParam
} = require('../middleware/validate');

// --- helpers ---------------------------------------------------------------
const mockRes = () => {
  const res = { statusCode: 200, body: null };
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (payload) => { res.body = payload; return res; };
  return res;
};

const runTx = (body) => {
  const req = { body };
  const res = mockRes();
  let nextCalled = false;
  validateTransactionInput(req, res, () => { nextCalled = true; });
  return { req, res, nextCalled };
};

const baseTx = {
  customerName: 'Test Customer',
  emptyCylinder: 'लोकप्रिय',
  filledCylinder: 'सुगम',
  remarks: ''
};

const validTx = (overrides = {}) => runTx({
  ...baseTx,
  totalAmount: 2060,
  paidAmount: 1000,
  paymentMode: 'cash',
  ...overrides
});

const runPayment = (body) => {
  const req = { body };
  const res = mockRes();
  let nextCalled = false;
  validatePaymentInput(req, res, () => { nextCalled = true; });
  return { req, res, nextCalled };
};

// --- 1. parseRupees --------------------------------------------------------
test('parseRupees accepts whole non-negative rupees (number and string)', () => {
  assert.deepEqual(parseRupees(2060), { ok: true, amount: 2060 });
  assert.deepEqual(parseRupees('1000'), { ok: true, amount: 1000 });
  assert.deepEqual(parseRupees(0), { ok: true, amount: 0 });
});

test('parseRupees rejects negative, fractional, junk and empty values', () => {
  assert.equal(parseRupees(-1).ok, false);
  assert.equal(parseRupees('−5').ok, false); // non-numeric dash → junk
  assert.equal(parseRupees(10.5).ok, false);
  assert.equal(parseRupees('abc').ok, false);
  assert.equal(parseRupees('') .ok, false);
  assert.equal(parseRupees(null).ok, false);
  assert.equal(parseRupees(undefined).ok, false);
});

// --- 2. status derivation (spec rules) -------------------------------------
test('status: paid 0 => incomplete regardless of prior rules ordering', () => {
  assert.equal(derivePaymentStatus(2060, 0), 'incomplete');
});

test('status: 0 < paid < total => partial', () => {
  assert.equal(derivePaymentStatus(2060, 1000), 'partial');
});

test('status: paid === total => complete (spec example: 2060/2060)', () => {
  assert.equal(derivePaymentStatus(2060, 2060), 'complete');
});

test('status: sum of installments equals total => complete', () => {
  // 1000 + 600 + 460 = 2060 (payment-mode spec example)
  const total = 2060;
  const installments = [1000, 600, 460];
  const paid = installments.reduce((sum, n) => sum + n, 0);
  assert.equal(paid, total);
  assert.equal(derivePaymentStatus(total, paid), 'complete');
  assert.equal(computeBalanceDue(total, paid), 0);
});

test('status: legacy transaction (total unknown) => null, never guessed', () => {
  assert.equal(derivePaymentStatus(null, 0), null);
  assert.equal(derivePaymentStatus(undefined, undefined), null);
  assert.equal(computeBalanceDue(null, 0), null);
});

test('balance: never negative and matches arithmetic', () => {
  assert.equal(computeBalanceDue(2060, 1000), 1060);
  assert.equal(computeBalanceDue(2060, 2060), 0);
  assert.equal(computeBalanceDue(2060, 0), 2060);
});

test('payment modes: only cash and online are valid', () => {
  assert.deepEqual(PAYMENT_MODES, ['cash', 'online']);
  assert.equal(isValidPaymentMode('cash'), true);
  assert.equal(isValidPaymentMode('online'), true);
  assert.equal(isValidPaymentMode('card'), false);
  assert.equal(isValidPaymentMode(''), false);
  assert.equal(isValidPaymentMode(null), false);
});

// --- 3. transaction-creation validation ------------------------------------
test('creation: full payment with mode accepted (spec case 1)', () => {
  const { nextCalled, res, req } = validTx({ paidAmount: 2060, paymentMode: 'cash' });
  assert.equal(nextCalled, true);
  assert.equal(req.body.paidAmount, 2060);
  assert.equal(req.body.totalAmount, 2060);
  assert.equal(req.body.paymentMode, 'cash');
  assert.equal(res.statusCode, 200);
});

test('creation: partial initial payment accepted (spec case 2)', () => {
  const { nextCalled, req } = validTx({ paidAmount: 1000, paymentMode: 'online' });
  assert.equal(nextCalled, true);
  assert.equal(req.body.paidAmount, 1000);
});

test('creation: zero initial payment accepted without a mode (spec case 3)', () => {
  const { nextCalled, req } = validTx({ paidAmount: 0, paymentMode: null });
  assert.equal(nextCalled, true);
  assert.equal(req.body.paidAmount, 0);
  assert.equal(req.body.paymentMode, null);
});

test('creation: absent paidAmount is recorded as explicit 0', () => {
  const { nextCalled, req } = validTx({ paidAmount: undefined, paymentMode: undefined });
  assert.equal(nextCalled, true);
  assert.equal(req.body.paidAmount, 0);
});

test('creation: negative paid amount rejected (spec case 4)', () => {
  const { nextCalled, res } = validTx({ paidAmount: -100 });
  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 400);
  assert.match(res.body.message, /ऋणात्मक/);
});

test('creation: paid exceeding total rejected (spec case 4)', () => {
  const { nextCalled, res } = validTx({ paidAmount: 3000, paymentMode: 'cash' });
  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 400);
  assert.match(res.body.message, /कुल रकमभन्दा बढी/);
});

test('creation: missing mode rejected when paid > 0', () => {
  const { nextCalled, res } = validTx({ paidAmount: 1000, paymentMode: null });
  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 400);
  assert.match(res.body.message, /मोड/);
});

test('creation: invalid mode rejected', () => {
  const { nextCalled, res } = validTx({ paidAmount: 1000, paymentMode: 'cheque' });
  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 400);
});

test('creation: missing or fractional total rejected', () => {
  assert.equal(validTx({ totalAmount: undefined }).nextCalled, false);
  assert.equal(validTx({ totalAmount: 2060.5 }).nextCalled, false);
  assert.equal(validTx({ totalAmount: 'abc' }).nextCalled, false);
  assert.equal(validTx({ totalAmount: -5 }).nextCalled, false);
});

// --- 4. later-payment validation -------------------------------------------
test('payment: valid installment accepted', () => {
  const { nextCalled, req } = runPayment({ amount: 600, mode: 'online', note: 'esewa' });
  assert.equal(nextCalled, true);
  assert.equal(req.body.amount, 600);
  assert.equal(req.body.mode, 'online');
  assert.equal(req.body.note, 'esewa');
});

test('payment: zero amount rejected (spec case 4/7 shape)', () => {
  const { nextCalled, res } = runPayment({ amount: 0, mode: 'cash' });
  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 400);
  assert.match(res.body.message, /शून्यभन्दा बढी/);
});

test('payment: negative amount rejected', () => {
  const { nextCalled, res } = runPayment({ amount: -50, mode: 'cash' });
  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 400);
});

test('payment: missing or invalid mode rejected', () => {
  assert.equal(runPayment({ amount: 100 }).nextCalled, false);
  assert.equal(runPayment({ amount: 100, mode: 'card' }).nextCalled, false);
});

test('payment: fractional amount rejected (integer rupees only)', () => {
  assert.equal(runPayment({ amount: 10.5, mode: 'cash' }).nextCalled, false);
});

test('payment: over-long note rejected', () => {
  const { nextCalled, res } = runPayment({ amount: 100, mode: 'cash', note: 'x'.repeat(201) });
  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 400);
});

// --- 5. transaction id guard -----------------------------------------------
test('id param: uuid accepted, junk rejected', () => {
  const okRes = mockRes();
  let okNext = false;
  validateTransactionIdParam(
    { params: { id: '8dfad5e0-eafc-4958-9ad5-9611f745374f' } },
    okRes,
    () => { okNext = true; }
  );
  assert.equal(okNext, true);

  const badRes = mockRes();
  let badNext = false;
  validateTransactionIdParam({ params: { id: 'DROP TABLE payments' } }, badRes, () => { badNext = true; });
  assert.equal(badNext, false);
  assert.equal(badRes.statusCode, 400);
});