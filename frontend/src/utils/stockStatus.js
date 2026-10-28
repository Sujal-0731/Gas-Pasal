// Stock warning thresholds — mirrors STOCK_STATUS in backend/config/constants.js
// (LOW_THRESHOLD: 5, CRITICAL_THRESHOLD: 2).
export const STOCK_LOW_THRESHOLD = 5;
export const STOCK_CRITICAL_THRESHOLD = 2;

// Availability rule mirrors stockService.checkFilledStock(): a brand with
// filled_count <= 0 cannot be sold (the API rejects the transaction).
// Statuses: 'outOfStock' | 'critical' | 'low' | 'ok'
export const getStockStatus = (filled) => {
  const n = filled || 0;
  if (n <= 0) return 'outOfStock';
  if (n <= STOCK_CRITICAL_THRESHOLD) return 'critical';
  if (n <= STOCK_LOW_THRESHOLD) return 'low';
  return 'ok';
};

export default getStockStatus;