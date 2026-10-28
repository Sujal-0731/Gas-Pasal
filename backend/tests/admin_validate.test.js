// Phase 6.1 unit tests — admin route id validation (DELETE customers).
// Run with: npm test. Uses only Node's built-in test runner.
const test = require('node:test');
const assert = require('node:assert/strict');

const { validateUuidParam } = require('../middleware/validate');

const mockRes = () => {
  const res = { statusCode: 200, body: null };
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (payload) => { res.body = payload; return res; };
  return res;
};

const run = (params) => {
  const req = { params };
  const res = mockRes();
  let nextCalled = false;
  validateUuidParam('id')(req, res, () => { nextCalled = true; });
  return { res, nextCalled };
};

const UUID = '123e4567-e89b-12d3-a456-426614174000';

test('validateUuidParam accepts a valid uuid (any case)', () => {
  assert.equal(run({ id: UUID }).nextCalled, true);
  assert.equal(run({ id: UUID.toUpperCase() }).nextCalled, true);
});

test('validateUuidParam rejects malformed, empty and missing ids with 400', () => {
  for (const id of ['not-a-uuid', '123', '', '../../etc', undefined]) {
    const { res, nextCalled } = run({ id });
    assert.equal(nextCalled, false, `expected rejection for ${String(id)}`);
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.success, false);
  }
});