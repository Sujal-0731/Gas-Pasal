// backend/utils/settingsLogic.js
// Pure settings rules shared by the controller and tests (no DB access).

// Initial default gas price, used ONLY when no saved setting exists in the
// settings table. Never applied to an existing transaction.
const DEFAULT_GAS_PRICE = 2060;

// Resolve the effective default price from the stored jsonb value.
// A missing, non-integer or non-positive value counts as "no saved setting"
// and falls back to the initial default.
const resolveDefaultPrice = (savedValue) =>
  Number.isInteger(savedValue) && savedValue > 0 ? savedValue : DEFAULT_GAS_PRICE;

module.exports = { DEFAULT_GAS_PRICE, resolveDefaultPrice };