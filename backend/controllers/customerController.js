// backend/controllers/customerController.js
const customerService = require('../services/customerService');
const logger = require('../utils/logger');

const getAllCustomers = async (req, res) => {
  try {
    const { search } = req.query;
    const { data, error } = await customerService.getAllCustomers(search);
    
    if (error) throw error;
    res.json({ success: true, data: data || [] });
  } catch (error) {
    logger.error('Get customers error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const createCustomer = async (req, res) => {
  try {
    const { name, phone, address, remarks } = req.body;
    
    const { data: existing } = await customerService.findCustomerByName(name);
    
    if (existing) {
      return res.json({ success: true, message: 'Customer already exists', data: existing });
    }
    
    const { data, error } = await customerService.createCustomer({ name, phone, address, remarks });
    
    if (error) throw error;
    res.json({ success: true, message: 'Customer added successfully', data });
  } catch (error) {
    logger.error('Create customer error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getAllCustomers, createCustomer };