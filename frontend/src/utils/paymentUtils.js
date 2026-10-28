// frontend/src/utils/paymentUtils.js
// Shared payment display helpers for Phase 6. Mirrors the derivation rules in
// backend/utils/paymentLogic.js — status is always computed from total and
// paid amounts, never read from a caller-supplied status string.

// totalAmount null/undefined => legacy row (not tracked) => null.
export const derivePaymentStatus = (totalAmount, totalPaid) => {
  if (totalAmount === null || totalAmount === undefined) return null;
  const total = Number(totalAmount);
  const paid = Number(totalPaid) || 0;
  if (paid === 0) return 'incomplete';
  if (paid < total) return 'partial';
  return 'complete';
};

// Remaining balance for a tracked transaction; null for legacy rows.
export const computeBalanceDue = (totalAmount, totalPaid) => {
  if (totalAmount === null || totalAmount === undefined) return null;
  const total = Number(totalAmount);
  const paid = Number(totalPaid) || 0;
  return Math.max(total - paid, 0);
};

// Whole rupees, language-aware digits (ne-NP renders Devanagari numerals).
export const formatRupees = (amount, language = 'np') => {
  const n = Number(amount) || 0;
  const locale = language === 'np' ? 'ne-NP' : 'en-US';
  const symbol = language === 'np' ? 'रु.' : 'Rs.';
  return `${symbol} ${n.toLocaleString(locale)}`;
};

// translation key for a derived status ('incomplete' | 'partial' | 'complete')
export const statusLabelKey = (status) => {
  if (status === 'incomplete') return 'statusIncomplete';
  if (status === 'partial') return 'statusPartial';
  if (status === 'complete') return 'statusComplete';
  return null;
};

// restrained status chip styling shared by all views
export const statusChipClasses = (status) => {
  if (status === 'incomplete') return 'bg-red-50 text-red-700 border-red-200';
  if (status === 'partial') return 'bg-amber-50 text-amber-700 border-amber-200';
  if (status === 'complete') return 'bg-green-50 text-green-700 border-green-200';
  return 'bg-gray-100 text-gray-600 border-gray-200';
};

// Convenience: derive straight from an API transaction row.
export const statusForTransaction = (tx) =>
  derivePaymentStatus(tx?.total_amount, tx?.total_paid);
