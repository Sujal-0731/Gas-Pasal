// backend/controllers/transactionController.js
const stockService = require('../services/stockService');
const transactionService = require('../services/transactionService');
const logger = require('../utils/logger');
const { notifyNewTransaction } = require('../services/pushService');

const createTransaction = async (req, res) => {
  try {
    const { customerName, emptyCylinder, filledCylinder, remarks, queueId } = req.body;
    
    console.log('=== TRANSACTION REQUEST ===');
    console.log('filledCylinder:', filledCylinder);
    console.log('emptyCylinder:', emptyCylinder);
    
    // 1. Find customer
    const { data: customer, error: customerError } = await transactionService.getCustomerByName(customerName.trim());
    
    if (customerError || !customer) {
      return res.status(404).json({ 
        success: false, 
        message: 'Customer not found. Please register first.' 
      });
    }
    
    // 2. Validate stock FIRST (before any changes)
    if (filledCylinder && filledCylinder !== 'कोही छैन') {
      console.log(`Validating stock for: ${filledCylinder}`);
      const hasStock = await stockService.checkFilledStock(filledCylinder);
      console.log(`hasStock returned: ${hasStock}`);
      
      if (!hasStock) {
        console.log(`❌ Stock validation failed for ${filledCylinder}`);
        return res.status(400).json({ 
          success: false, 
          message: `${filledCylinder} को स्टक सकियो। कृपया पहिले रिफिल गर्नुहोस्।` 
        });
      }
      console.log(`✅ Stock validation passed for ${filledCylinder}`);
    }
    
    // 3. Generate transaction ID
    const transactionId = await transactionService.generateTransactionId();
    
    // 4. Get queue data (but don't mark as completed yet)
    let source = 'direct';
    let queueDate = null;
    let queueItem = null;
    
    if (queueId) {
      source = 'queue';
      const { data: queueData } = await transactionService.getQueueDate(queueId);
      queueDate = queueData?.queued_at;
      queueItem = queueData;
    }
    
    // 5. Insert transaction
    const { data, error } = await transactionService.createTransaction({
      transaction_id: transactionId,
      customer_id: customer.id,
      customer_name: customerName.trim(),
      empty_cylinder: emptyCylinder,
      filled_cylinder: filledCylinder,
      remarks: remarks || null,
      source: source,
      queue_date: queueDate
    });
    
    if (error) throw error;
    
    // 6. ONLY AFTER successful transaction, mark queue as completed
    if (queueId && queueItem) {
      await transactionService.completeQueueItem(queueId);
    }
    
    // 7. Update stock
    if (filledCylinder && filledCylinder !== 'कोही छैन') {
      console.log(`Updating filled stock for ${filledCylinder} (decrease by 1)`);
      await stockService.updateFilledStock(filledCylinder, 1, 'decrease');
    }
    
    if (!queueId && emptyCylinder && emptyCylinder !== 'कोही छैन') {
      console.log(`Updating empty stock for ${emptyCylinder} (increase by 1)`);
      await stockService.updateEmptyStock(emptyCylinder, 1, 'increase');
    }
    
    logger.info(`Transaction recorded: ${transactionId} for ${customerName}`);
    await notifyNewTransaction(
      req.user.role,      
      req.user.id,      
      customerName,      
      emptyCylinder,     
      filledCylinder      
    );
    res.json({ 
      success: true, 
      message: 'Transaction recorded successfully', 
      data 
    });
    
  } catch (error) {
    console.error('Transaction error:', error);
    logger.error('Transaction error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getCustomerHistory = async (req, res) => {
  try {
    const { name } = req.params;
    const decodedName = decodeURIComponent(name);
    
    const { data: customer, error: customerError } = await transactionService.getCustomerByName(decodedName);
    
    if (customerError || !customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    
    const { data: transactions, error: transError } = await transactionService.getCustomerTransactions(customer.id);
    
    if (transError) throw transError;
    
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

// ✅ Simplified - uses transactionService (no database code!)
const getAllTransactions = async (req, res) => {
  try {
    const { page, limit, search, cylinder, date_from, date_to } = req.query;
    
    const result = await transactionService.getAllTransactionsWithFilters({
      page,
      limit,
      search,
      cylinder,
      date_from,
      date_to
    });
    
    if (result.error) throw result.error;
    
    res.json({
      success: true,
      transactions: result.data,
      pagination: result.pagination
    });
    
  } catch (error) {
    logger.error('Get all transactions error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { 
  createTransaction, 
  getCustomerHistory, 
  getAllTransactions
};