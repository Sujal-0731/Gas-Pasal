// backend/utils/paymentLogic.js
// Pure payment math and validation shared by middleware, services and tests.
// Money convention: whole rupees (integers). No floating point anywhere.

const PAYMENT_MODES = ['cash', 'online'];

// Validate a rupee amount. Accepts number or numeric string.
// Returns { ok: true, amount: <integer rupees> } or { ok: false, message }.
// Zero is a valid amount here (credit sale); callers reject zero where the
// rule is "must be greater than zero".
const parseRupees = (value) => {
  if (value === null || value === undefined || value === '') {
    return { ok: false, message: 'रकम आवश्यक छ' };
  }
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) {
    return { ok: false, message: 'रकम ठूलो/सानो नम्बर हुनुपर्छ' };
  }
  if (n < 0) {
    return { ok: false, message: 'रकम ऋणात्मक हुन सक्दैन' };
  }
  if (!Number.isInteger(n)) {
    return { ok: false, message: 'रकम पूर्णांक रुपैयाँमा मात्र हुन सक्छ' };
  }
  return { ok: true, amount: n };
};

const isValidPaymentMode = (mode) =>
  typeof mode === 'string' && PAYMENT_MODES.includes(mode);

// Status rules (Phase 6 spec), derived from total and payments — never from a
// frontend-supplied status. totalAmount null/undefined means a legacy row
// whose payment state cannot be established: status is null (not tracked).
const derivePaymentStatus = (totalAmount, totalPaid) => {
  if (totalAmount === null || totalAmount === undefined) return null;
  const total = Number(totalAmount);
  const paid = Number(totalPaid) || 0;
  if (paid === 0) return 'incomplete';
  if (paid < total) return 'partial';
  return 'complete'; // paid >= total; overpayment is impossible (server-enforced)
};

// Remaining balance for a tracked transaction; null for legacy rows.
const computeBalanceDue = (totalAmount, totalPaid) => {
  if (totalAmount === null || totalAmount === undefined) return null;
  const total = Number(totalAmount);
  const paid = Number(totalPaid) || 0;
  return Math.max(total - paid, 0);
};

module.exports = {
  PAYMENT_MODES,
  parseRupees,
  isValidPaymentMode,
  derivePaymentStatus,
  computeBalanceDue
};
