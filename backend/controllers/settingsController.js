// backend/controllers/settingsController.js
// Phase 6.1: shop settings stored in the `settings` table (key/value, jsonb).
// GET is open to any authenticated user (every transaction flow needs the
// current default price); PUT is admin-only (see routes/settingsRoutes.js).
// Changing the price affects future prefill only — stored totals, payments,
// balances and stock are never touched from here.
const supabase = require('../config/database');
const logger = require('../utils/logger');
const { resolveDefaultPrice } = require('../utils/settingsLogic');

const DEFAULT_PRICE_KEY = 'default_price';

const getSettings = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', DEFAULT_PRICE_KEY)
      .maybeSingle();

    if (error) throw error;

    return res.json({
      success: true,
      settings: { defaultPrice: resolveDefaultPrice(data ? data.value : null) }
    });
  } catch (error) {
    logger.error('Get settings error:', error);
    return res.status(500).json({ success: false, message: 'Failed to load settings' });
  }
};

const updateSettings = async (req, res) => {
  try {
    // validateSettingsInput already parsed and enforced a positive integer.
    const { defaultPrice } = req.body;

    const { error } = await supabase
      .from('settings')
      .upsert(
        { key: DEFAULT_PRICE_KEY, value: defaultPrice, updated_at: new Date().toISOString() },
        { onConflict: 'key' }
      );

    if (error) throw error;

    logger.info(`Default gas price updated to Rs. ${defaultPrice} by ${req.user.username}`);
    return res.json({ success: true, settings: { defaultPrice } });
  } catch (error) {
    logger.error('Update settings error:', error);
    return res.status(500).json({ success: false, message: 'Failed to save settings' });
  }
};

module.exports = { getSettings, updateSettings };