// backend/controllers/customerController.js
const customerService = require('../services/customerService');
const transactionService = require('../services/transactionService');
const logger = require('../utils/logger');
const { notifyAllAdmins } = require('../services/pushService');

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
    await notifyAllAdmins(
      '📋 New Customer Created',
      `${req.user.username} created customer: ${name}`
    );
    res.json({ success: true, message: 'Customer added successfully', data });
  
  } catch (error) {
    logger.error('Create customer error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, address, remarks } = req.body;
    
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (remarks !== undefined) updateData.remarks = remarks;
    
    const { data, error } = await customerService.updateCustomer(id, updateData);
    
    if (error) throw error;
    res.json({ success: true, message: 'Customer updated', customer: data });
  } catch (error) {
    logger.error('Update customer error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getCustomerHistory = async (req, res) => {
  try {
    const { name } = req.params;
    const decodedName = decodeURIComponent(name);
    
    // Find customer using service (no direct supabase)
    const { data: customer, error: customerError } = await customerService.findCustomerByName(decodedName);
    
    if (customerError || !customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    
    // Get transactions using transactionService (no direct supabase)
    const { data: transactions, error: transError } = await transactionService.getCustomerTransactions(customer.id);
    
    if (transError) throw transError;
    
    // Format transactions with Nepali dates using transactionService
    const formattedTransactions = transactionService.formatTransactionsWithDates(transactions);
    
    res.json({ 
      success: true, 
      customer, 
      transactions: formattedTransactions, 
      totalExchanges: formattedTransactions.length 
    });
    
  } catch (error) {
    logger.error('Customer history error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { 
  getAllCustomers, 
  createCustomer, 
  updateCustomer, 
  getCustomerHistory 
};