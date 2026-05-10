// backend/controllers/stockController.js
const stockService = require('../services/stockService');
const logger = require('../utils/logger');

const getStock = async (req, res) => {
  try {
    const stock = await stockService.getStock();
    res.json({ success: true, stock });
  } catch (error) {
    logger.error('Get stock error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getStock };