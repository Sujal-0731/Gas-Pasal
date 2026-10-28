const supabase = require('../config/database');
const logger = require('../utils/logger');

const findCustomerByName = async (name) => {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .ilike('name', name)
    .single();
  
  if (error && error.code !== 'PGRST116') {
    logger.error('Find customer error:', error);
  }
  
  return { data, error };
};

const getAllCustomers = async (search = null) => {
  let query = supabase.from('customers').select('*');
  
  if (search && search.trim() !== '') {
    query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`);
  }
  
  const { data, error } = await query.order('created_at', { ascending: false });
  return { data: data || [], error };
};

const createCustomer = async (customerData) => {
  // Generate customer ID
  const { data: allCustomers } = await supabase.from('customers').select('customer_id');
  let nextNum = 1;
  if (allCustomers && allCustomers.length > 0) {
    const numbers = allCustomers.map(c => parseInt(c.customer_id.replace('CUST', '')) || 0);
    nextNum = Math.max(...numbers) + 1;
  }
  const customerId = 'CUST' + String(nextNum).padStart(3, '0');
  
  const { data, error } = await supabase
    .from('customers')
    .insert([{ customer_id: customerId, ...customerData }])
    .select()
    .single();
  
  return { data, error };
};const updateCustomer = async (id, customerData) => {
  const { data, error } = await supabase
    .from('customers')
    .update(customerData)
    .eq('id', id)
    .select()
    .single();
  
  return { data, error };
};

// Phase 6.1: admin customer delete — SAFETY RULE.
// transactions.customer_id is ON DELETE CASCADE (verified live), so deleting
// a customer row would silently destroy their payment history. Refuse when
// the customer has any transaction, or is waiting in the queue (queue rows
// have no cascade and would be left dangling). Only history-free customers
// (duplicates, mistakes, test rows) are actually removable.
const deleteCustomer = async (id) => {
  const { data: existing, error: findError } = await supabase
    .from('customers')
    .select('id, name')
    .eq('id', id)
    .maybeSingle();

  if (findError) return { error: findError };
  if (!existing) return { notFound: true };

  const { count: txCount, error: txError } = await supabase
    .from('transactions')
    .select('*', { count: 'exact', head: true })
    .eq('customer_id', id);
  if (txError) return { error: txError };
  if (txCount > 0) return { blocked: 'history', count: txCount };

  const { count: queueCount, error: queueError } = await supabase
    .from('queue')
    .select('*', { count: 'exact', head: true })
    .eq('customer_id', id)
    .eq('status', 'waiting');
  if (queueError) return { error: queueError };
  if (queueCount > 0) return { blocked: 'queue' };

  const { error: deleteError } = await supabase
    .from('customers')
    .delete()
    .eq('id', id);
  if (deleteError) return { error: deleteError };

  return { data: existing };
};

module.exports = { findCustomerByName, getAllCustomers, createCustomer, updateCustomer, deleteCustomer };