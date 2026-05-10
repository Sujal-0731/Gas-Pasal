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

const updateStock = async (req, res) => {
  try {
    const { type } = req.params;
    const { filled_count, empty_count } = req.body;
    
    const updateData = {};
    if (filled_count !== undefined) updateData.filled_count = filled_count;
    if (empty_count !== undefined) updateData.empty_count = empty_count;
    updateData.updated_at = new Date();
    
    const { data, error } = await stockService.updateStock(
      decodeURIComponent(type), 
      updateData
    );
    
    if (error) throw error;
    res.json({ success: true, message: 'Stock updated', stock: data });
  } catch (error) {
    logger.error('Update stock error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getStock, updateStock };