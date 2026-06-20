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
//Get cutomer by id

const getCustomerById = async (customerId) => {
  const { data, error } = await supabase
    .from('customers')
    .select('id, customer_id, name, phone, address, remarks')
    .eq('id', customerId)
    .single();
  console.log(data,error);
  return { data, error };
};

// Get customer by name
const getCustomerByName = async (name) => {
  const { data, error } = await supabase
    .from('customers')
    .select('id, customer_id, name, phone, address, remarks')
    .ilike('name', name)
    .single();
  console.log(data,error);
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

// ✅ NEW: Get all transactions with pagination and filters
const getAllTransactionsWithFilters = async (filters = {}) => {
  const { 
    page = 1, 
    limit = 20, 
    search, 
    cylinder, 
    date_from, 
    date_to 
  } = filters;
  
  const offset = (parseInt(page) - 1) * parseInt(limit);
  
  let query = supabase
    .from('transactions')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });
  
  // Search by customer name
  if (search && search.trim()) {
    query = query.ilike('customer_name', `%${search.trim()}%`);
  }
  
  // Filter by sold gas (filled cylinder)
  if (cylinder && cylinder !== 'all') {
    query = query.eq('filled_cylinder', cylinder);
  }
  
  // Date range filters
  if (date_from) {
    query = query.gte('created_at', date_from);
  }
  if (date_to) {
    query = query.lte('created_at', `${date_to} 23:59:59`);
  }
  
  const { data, error, count } = await query
    .range(offset, offset + parseInt(limit) - 1);
  
  if (error) {
    logger.error('Get all transactions error:', error);
    return { data: [], error, pagination: null };
  }
  
  // Format dates for display
  const formattedTransactions = formatTransactionsWithDates(data || []);
  
  return {
    data: formattedTransactions,
    error: null,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil((count || 0) / parseInt(limit)),
      totalItems: count || 0,
      itemsPerPage: parseInt(limit)
    }
  };
};

// Get all transactions (simple, for admin/reports)
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
  getCustomerById,
  completeQueueItem,
  getQueueDate,
  formatTransactionsWithDates,
  getAllTransactions,
  getAllTransactionsWithFilters 
};