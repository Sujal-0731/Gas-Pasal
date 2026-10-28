// backend/controllers/transactionController.js
const stockService = require('../services/stockService');
const transactionService = require('../services/transactionService');
const logger = require('../utils/logger');
const { notifyNewTransaction } = require('../services/pushService');

const createTransaction = async (req, res) => {
  try {
    const { customerId, customerName, emptyCylinder, filledCylinder, remarks, queueId,
            totalAmount, paidAmount, paymentMode, paymentNote } = req.body;
    
    console.log('=== TRANSACTION REQUEST ===');
    console.log('customerId:', customerId);
    console.log('customerName:', customerName);
    console.log('filledCylinder:', filledCylinder);
    console.log('emptyCylinder:', emptyCylinder);
    
    // 1. Find customer
    const { data: customer, error: customerError } = await transactionService.getCustomerById(customerId);
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
    
    // 5. Insert transaction + initial payment in one atomic DB operation
    // (Phase 6). Validation failures roll back both rows; stock, queue and
    // notifications only run after the sale and its payment are saved.
    const { data, error } = await transactionService.createTransactionWithPayment({
      transaction_id: transactionId,
      customer_id: customer.id,
      customer_name: customer.name,
      empty_cylinder: emptyCylinder,
      filled_cylinder: filledCylinder,
      remarks: remarks || null,
      source: source,
      queue_date: queueDate,
      total_amount: totalAmount,
      paid_amount: paidAmount,
      payment_mode: paymentMode,
      payment_note: paymentNote
    });
    
    if (error) {
      // P0001 = raised validation exception; 22xxx/23xxx = constraint violations.
      // Both are caused by the request; anything else is a server fault.
      const clientError = error.code === 'P0001' || /^2[23]/.test(error.code || '');
      return res.status(clientError ? 400 : 500).json({
        success: false,
        message: error.message || 'Transaction could not be recorded'
      });
    }
    
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
    const { page, limit, search, cylinder, date_from, date_to, outstanding } = req.query;
    
    const result = await transactionService.getAllTransactionsWithFilters({
      page,
      limit,
      search,
      cylinder,
      date_from,
      date_to,
      outstanding
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
};// Phase 6: record a later installment against an existing transaction.
// Never creates a sale, queue entry, stock movement or refill — the balance
// and status are enforced atomically inside the record_payment() RPC.
const recordPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, mode, note } = req.body;

    const { data: payment, error } = await transactionService.recordPayment({
      transactionId: id,
      amount,
      mode,
      note
    });

    if (error) {
      const clientError = error.code === 'P0001' || /^2[23]/.test(error.code || '');
      return res.status(clientError ? 400 : 500).json({
        success: false,
        message: error.message || 'Payment could not be recorded'
      });
    }

    logger.info(`Payment recorded: Rs. ${amount} (${mode}) for transaction ${id}`);
    res.json({
      success: true,
      message: 'Payment recorded successfully',
      payment
    });
  } catch (error) {
    logger.error('Record payment error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Phase 6: full installment history for one transaction.
const getTransactionPayments = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await transactionService.getTransactionPayments(id);
    if (error) throw error;

    res.json({ success: true, payments: data });
  } catch (error) {
    logger.error('Get transaction payments error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { 
  createTransaction, 
  getCustomerHistory,
  getAllTransactions,
  recordPayment,
  getTransactionPayments
};