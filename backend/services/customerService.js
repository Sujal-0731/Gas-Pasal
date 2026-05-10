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
};

module.exports = { findCustomerByName, getAllCustomers, createCustomer };