// backend/controllers/transactionController.js
const supabase = require('../config/database');
const stockService = require('../services/stockService');
const logger = require('../utils/logger');

const createTransaction = async (req, res) => {
  try {
    const { customerName, emptyCylinder, filledCylinder, remarks, queueId } = req.body;
    
    // Find customer
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id')
      .ilike('name', customerName.trim())
      .single();
    
    if (customerError || !customer) {
      return res.status(404).json({ 
        success: false, 
        message: 'Customer not found. Please register first.' 
      });
    }
    
    // Generate transaction ID
    const { data: allTransactions } = await supabase
      .from('transactions')
      .select('transaction_id');
    
    let nextNum = 1;
    if (allTransactions && allTransactions.length > 0) {
      const numbers = allTransactions.map(t => parseInt(t.transaction_id.replace('TR', '')) || 0);
      nextNum = Math.max(...numbers) + 1;
    }
    const transactionId = 'TR' + String(nextNum).padStart(5, '0');
    
    // Handle queue if present
    let source = 'direct';
    let queueDate = null;
    
    if (queueId) {
      source = 'queue';
      const { data: queueData } = await supabase
        .from('queue')
        .select('queued_at')
        .eq('id', queueId)
        .single();
      
      queueDate = queueData?.queued_at;
      
      await supabase
        .from('queue')
        .update({ status: 'completed', completed_at: new Date() })
        .eq('id', queueId);
    }
    
    // Validate filled cylinder stock
    if (filledCylinder && filledCylinder !== 'कोही छैन') {
      const hasStock = await stockService.checkFilledStock(filledCylinder);
      if (!hasStock) {
        return res.status(400).json({ 
          success: false, 
          message: `${filledCylinder} को स्टक सकियो। कृपया पहिले रिफिल गर्नुहोस्。` 
        });
      }
    }
    
    // Insert transaction
    const { data, error } = await supabase
      .from('transactions')
      .insert([{
        transaction_id: transactionId,
        customer_id: customer.id,
        customer_name: customerName.trim(),
        empty_cylinder: emptyCylinder,
        filled_cylinder: filledCylinder,
        remarks: remarks || null,
        source: source,
        queue_date: queueDate
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    // Update stock
    if (filledCylinder && filledCylinder !== 'कोही छैन') {
      await stockService.updateFilledStock(filledCylinder, 1, 'decrease');
    }
    
    if (emptyCylinder && emptyCylinder !== 'कोही छैन') {
      await stockService.updateEmptyStock(emptyCylinder, 1, 'increase');
    }
    
    logger.info(`Transaction recorded: ${transactionId} for ${customerName}`);
    
    res.json({ 
      success: true, 
      message: 'Transaction recorded successfully', 
      data 
    });
    
  } catch (error) {
    logger.error('Transaction error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getCustomerHistory = async (req, res) => {
  try {
    const { name } = req.params;
    
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .ilike('name', name)
      .single();
    
    if (customerError || !customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    
    const { data: transactions, error: transError } = await supabase
      .from('transactions')
      .select('*')
      .eq('customer_id', customer.id)
      .order('created_at', { ascending: false });
    
    if (transError) throw transError;
    
    const formattedTransactions = (transactions || []).map(t => {
      const transDate = new Date(t.created_at);
      const formattedTransDate = transDate.toLocaleDateString('ne-NP');
      const formattedTransTime = transDate.toLocaleTimeString('ne-NP', { hour: '2-digit', minute: '2-digit' });
      
      let queueDateFormatted = null;
      let queueTimeFormatted = null;
      if (t.queue_date) {
        const queueDate = new Date(t.queue_date);
        queueDateFormatted = queueDate.toLocaleDateString('ne-NP');
        queueTimeFormatted = queueDate.toLocaleTimeString('ne-NP', { hour: '2-digit', minute: '2-digit' });
      }
      
      return {
        ...t,
        date: formattedTransDate,
        time: formattedTransTime,
        queue_date_formatted: queueDateFormatted,
        queue_time_formatted: queueTimeFormatted
      };
    });
    
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

module.exports = { createTransaction, getCustomerHistory };