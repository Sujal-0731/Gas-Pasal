// backend/services/transactionService.js
const supabase = require('../config/database');
const logger = require('../utils/logger');

// Generate next transaction ID
const generateTransactionId = async () => {
  const { data: allTransactions } = await supabase
    .from('transactions')
    .select('transaction_id');
  
  let nextNum = 1;
  if (allTransactions && allTransactions.length > 0) {
    const numbers = allTransactions.map(t => parseInt(t.transaction_id.replace('TR', '')) || 0);
    nextNum = Math.max(...numbers) + 1;
  }
  return 'TR' + String(nextNum).padStart(5, '0');
};

// Create a new transaction
const createTransaction = async (transactionData) => {
  const { data, error } = await supabase
    .from('transactions')
    .insert([transactionData])
    .select()
    .single();
  
  if (error) {
    logger.error('Create transaction error:', error);
  }
  
  return { data, error };
};

// Get customer transactions by customer ID
const getCustomerTransactions = async (customerId) => {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false });
  
  if (error) {
    logger.error('Get customer transactions error:', error);
  }
  
  return { data: data || [], error };
};

// Get customer by name
const getCustomerByName = async (name) => {
  const { data, error } = await supabase
    .from('customers')
    .select('id, customer_id, name, phone, address, remarks')
    .ilike('name', name)
    .single();
  
  return { data, error };
};

// Update queue status
const completeQueueItem = async (queueId) => {
  const { error } = await supabase
    .from('queue')
    .update({ status: 'completed', completed_at: new Date() })
    .eq('id', queueId);
  
  return { error };
};

// Get queue date
const getQueueDate = async (queueId) => {
  const { data, error } = await supabase
    .from('queue')
    .select('queued_at')
    .eq('id', queueId)
    .single();
  
  return { data, error };
};

// Format transactions with Nepali dates (helper)
const formatTransactionsWithDates = (transactions) => {
  return (transactions || []).map(t => {
    let transDate, formattedTransDate, formattedTransTime;
    
    try {
      transDate = new Date(t.created_at);
      formattedTransDate = transDate.toLocaleDateString('ne-NP');
      formattedTransTime = transDate.toLocaleTimeString('ne-NP', { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      formattedTransDate = t.created_at || 'Unknown date';
      formattedTransTime = '';
    }
    
    let queueDateFormatted = null;
    let queueTimeFormatted = null;
    if (t.queue_date) {
      try {
        const queueDate = new Date(t.queue_date);
        queueDateFormatted = queueDate.toLocaleDateString('ne-NP');
        queueTimeFormatted = queueDate.toLocaleTimeString('ne-NP', { hour: '2-digit', minute: '2-digit' });
      } catch (e) {
        queueDateFormatted = null;
      }
    }
    
    return {
      ...t,
      date: formattedTransDate,
      time: formattedTransTime,
      queue_date_formatted: queueDateFormatted,
      queue_time_formatted: queueTimeFormatted
    };
  });
};

// Get all transactions (for admin/reports)
const getAllTransactions = async (limit = 100) => {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  
  return { data: data || [], error };
};

module.exports = {
  generateTransactionId,
  createTransaction,
  getCustomerTransactions,
  getCustomerByName,
  completeQueueItem,
  getQueueDate,
  formatTransactionsWithDates,
  getAllTransactions
};