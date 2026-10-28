// Phase 6.1 unit tests — configurable default gas price. Run with: npm test
// Uses only Node's built-in test runner: no dependencies added.
const test = require('node:test');
const assert = require('node:assert/strict');

const { validateSettingsInput } = require('../middleware/validate');
const { DEFAULT_GAS_PRICE, resolveDefaultPrice } = require('../utils/settingsLogic');

// --- helpers ---------------------------------------------------------------
const mockRes = () => {
  const res = { statusCode: 200, body: null };
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (payload) => { res.body = payload; return res; };
  return res;
};

const runSettings = (body) => {
  const req = { body };
  const res = mockRes();
  let nextCalled = false;
  validateSettingsInput(req, res, () => { nextCalled = true; });
  return { req, res, nextCalled };
};

// --- 1. initial default fallback ------------------------------------------
test('initial default price is Rs. 2,060', () => {
  assert.equal(DEFAULT_GAS_PRICE, 2060);
});

test('no saved setting (null/undefined/missing row) falls back to 2060', () => {
  assert.equal(resolveDefaultPrice(null), 2060);
  assert.equal(resolveDefaultPrice(undefined), 2060);
});

test('saved valid price wins over the fallback', () => {
  assert.equal(resolveDefaultPrice(2100), 2100);
  assert.equal(resolveDefaultPrice(1), 1);
});

test('corrupt saved value (zero, negative, fractional, junk) falls back to 2060', () => {
  assert.equal(resolveDefaultPrice(0), 2060);
  assert.equal(resolveDefaultPrice(-5), 2060);
  assert.equal(resolveDefaultPrice(2060.5), 2060);
  assert.equal(resolveDefaultPrice('abc'), 2060);
});

// --- 2. input validation (backend must reject what the frontend may allow) --
test('validateSettingsInput accepts a positive whole rupee price (number and string)', () => {
  const a = runSettings({ defaultPrice: 2060 });
  assert.equal(a.nextCalled, true);
  assert.equal(a.req.body.defaultPrice, 2060);

  const b = runSettings({ defaultPrice: '2100' });
  assert.equal(b.nextCalled, true);
  assert.equal(b.req.body.defaultPrice, 2100);
});

test('validateSettingsInput rejects zero, negative, fractional and junk prices', () => {
  for (const value of [0, -1, 2060.5, 'abc', '', null, undefined, '−5']) {
    const { res, nextCalled } = runSettings({ defaultPrice: value });
    assert.equal(nextCalled, false, `expected rejection for ${String(value)}`);
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.success, false);
  }
});

test('validateSettingsInput normalizes the parsed value on success', () => {
  const { req } = runSettings({ defaultPrice: '  9999 ' });
  assert.equal(req.body.defaultPrice, 9999);
});