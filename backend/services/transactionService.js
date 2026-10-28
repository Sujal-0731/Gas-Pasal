// backend/services/transactionService.js
const supabase = require('../config/database');
const logger = require('../utils/logger');
const { derivePaymentStatus, computeBalanceDue } = require('../utils/paymentLogic');

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
    return { data: [], error };
  }

  // Phase 6: attach derived payment summaries (paid / balance / status)
  const { data: summarized, error: summaryError } = await attachPaymentSummaries(data || []);
  if (summaryError) return { data: [], error: summaryError };

  return { data: summarized, error: null };
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
    date_to,
    outstanding
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
  
  // Phase 6.1: outstanding=1 → only transactions whose derived balance is
  // still owed. supabase-js cannot filter on (total - paid), so the filtered
  // set is fetched once (same approach + scale as the dashboard stat), the
  // balance is derived in JS, and the requested page is sliced from that.
  // Pagination/totalItems count only due rows; legacy rows (total_amount
  // NULL) never qualify — their payment state is never counted as owed.
  if (outstanding === '1' || outstanding === 'true') {
    const { data: filteredRows, error: rowError } = await query;
    if (rowError) {
      logger.error('Get all transactions (outstanding) error:', rowError);
      return { data: [], error: rowError, pagination: null };
    }

    const rows = filteredRows || [];
    const trackedRows = rows.filter(
      t => t.total_amount !== null && t.total_amount !== undefined
    );

    const paidBy = {};
    if (trackedRows.length > 0) {
      const { data: pays, error: payError } = await supabase
        .from('payments')
        .select('transaction_id, amount')
        .in('transaction_id', trackedRows.map(t => t.id));
      if (payError) {
        logger.error('Get all transactions (outstanding payments) error:', payError);
        return { data: [], error: payError, pagination: null };
      }
      (pays || []).forEach(p => {
        paidBy[p.transaction_id] = (paidBy[p.transaction_id] || 0) + p.amount;
      });
    }

    // rows are already ordered created_at DESC — the slice keeps that order
    const dueRows = trackedRows.filter(
      t => computeBalanceDue(t.total_amount, paidBy[t.id]) > 0
    );
    const total = dueRows.length;
    const pageRows = dueRows.slice(offset, offset + parseInt(limit) - 1);

    const formattedTransactions = formatTransactionsWithDates(pageRows);
    const { data: summarized, error: summaryError } =
      await attachPaymentSummaries(formattedTransactions);
    if (summaryError) {
      logger.error('Get all transactions (outstanding summary) error:', summaryError);
      return { data: [], error: summaryError, pagination: null };
    }

    return {
      data: summarized,
      error: null,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    };
  }

  const { data, error, count } = await query
    .range(offset, offset + parseInt(limit) - 1);
  
  if (error) {
    logger.error('Get all transactions error:', error);
    return { data: [], error, pagination: null };
  }
  
  // Format dates for display
  const formattedTransactions = formatTransactionsWithDates(data || []);

  // Phase 6: attach derived payment summaries
  const { data: summarized, error: summaryError } = await attachPaymentSummaries(formattedTransactions);
  if (summaryError) {
    logger.error('Get all transactions summary error:', summaryError);
    return { data: [], error: summaryError, pagination: null };
  }
  
  return {
    data: summarized,
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

// Phase 6: attach derived payment info to transaction rows.
// Legacy rows (total_amount IS NULL) get null summaries — their payment state
// is unknown and is never guessed as paid or unpaid.
const attachPaymentSummaries = async (transactions) => {
  const list = transactions || [];
  const tracked = list.filter(t => t.total_amount !== null && t.total_amount !== undefined);

  const paidBy = {};
  const countBy = {};
  const modesBy = {};

  if (tracked.length > 0) {
    const { data: pays, error } = await supabase
      .from('payments')
      .select('transaction_id, amount, payment_mode, paid_at')
      .in('transaction_id', tracked.map(t => t.id))
      .order('paid_at', { ascending: true });

    if (error) {
      logger.error('Attach payment summaries error:', error);
      return { data: null, error };
    }

    (pays || []).forEach(p => {
      paidBy[p.transaction_id] = (paidBy[p.transaction_id] || 0) + p.amount;
      countBy[p.transaction_id] = (countBy[p.transaction_id] || 0) + 1;
      if (!modesBy[p.transaction_id]) modesBy[p.transaction_id] = [];
      if (!modesBy[p.transaction_id].includes(p.payment_mode)) {
        modesBy[p.transaction_id].push(p.payment_mode);
      }
    });
  }

  const summarized = list.map(t => {
    const isTracked = t.total_amount !== null && t.total_amount !== undefined;
    if (!isTracked) {
      return {
        ...t,
        total_paid: null,
        balance_due: null,
        payment_status: null,
        payment_count: null,
        payment_modes: null
      };
    }

    const paid = paidBy[t.id] || 0;
    return {
      ...t,
      total_paid: paid,
      balance_due: computeBalanceDue(t.total_amount, paid),
      payment_status: derivePaymentStatus(t.total_amount, paid),
      payment_count: countBy[t.id] || 0,
      payment_modes: modesBy[t.id] || []
    };
  });

  return { data: summarized, error: null };
};

// Phase 6: create transaction + initial payment in ONE database transaction
// (create_transaction_with_payment RPC — see migrations/phase6_payments.sql).
// Any validation failure rolls back both rows: no orphan payment, and no sale
// recorded with a payment that was not saved.
const createTransactionWithPayment = async (fields) => {
  const { data, error } = await supabase.rpc('create_transaction_with_payment', {
    p_transaction_id: fields.transaction_id,
    p_customer_id: fields.customer_id,
    p_customer_name: fields.customer_name,
    p_empty_cylinder: fields.empty_cylinder,
    p_filled_cylinder: fields.filled_cylinder,
    p_remarks: fields.remarks || null,
    p_source: fields.source,
    p_queue_date: fields.queue_date || null,
    p_total_amount: fields.total_amount,
    p_paid_amount: fields.paid_amount,
    p_payment_mode: fields.payment_mode || null,
    p_payment_note: fields.payment_note || null
  });

  if (error) logger.error('Create transaction with payment error:', error);
  return { data, error };
};

// Phase 6: later installment. Atomic and row-locked inside record_payment()
// (FOR UPDATE + re-summed balance), so concurrent calls cannot overpay.
const recordPayment = async ({ transactionId, amount, mode, note }) => {
  const { data, error } = await supabase.rpc('record_payment', {
    p_transaction_id: transactionId,
    p_amount: amount,
    p_mode: mode,
    p_note: note || null
  });

  if (error) logger.error('Record payment error:', error);
  return { data, error };
};

const getTransactionPayments = async (transactionId) => {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('transaction_id', transactionId)
    .order('paid_at', { ascending: true });

  if (error) logger.error('Get transaction payments error:', error);
  return { data: data || [], error };
};

module.exports = {
  generateTransactionId,
  createTransaction,
  createTransactionWithPayment,
  recordPayment,
  getTransactionPayments,
  attachPaymentSummaries,
  getCustomerTransactions,
  getCustomerByName,
  getCustomerById,
  completeQueueItem,
  getQueueDate,
  formatTransactionsWithDates,
  getAllTransactions,
  getAllTransactionsWithFilters 
};