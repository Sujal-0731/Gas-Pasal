// backend/services/stockService.js
const supabase = require('../config/database');
const logger = require('../utils/logger');

const getStock = async () => {
  const { data, error } = await supabase
    .from('stock')
    .select('*')
    .order('cylinder_type');
  
  if (error) throw error;
  
  const stock = {};
  (data || []).forEach(item => {
    stock[item.cylinder_type] = { 
      filled: item.filled_count, 
      empty: item.empty_count 
    };
  });
  
  return stock;
};

const updateFilledStock = async (cylinderType, quantity, operation = 'decrease') => {
  const { data: current, error } = await supabase
    .from('stock')
    .select('filled_count')
    .eq('cylinder_type', cylinderType)
    .single();
  
  if (error) throw error;
  
  let newCount = current.filled_count;
  if (operation === 'decrease') {
    newCount = current.filled_count - quantity;
  } else {
    newCount = current.filled_count + quantity;
  }
  
  if (newCount < 0) {
    throw new Error(`Insufficient filled stock for ${cylinderType}`);
  }
  
  const { error: updateError } = await supabase
    .from('stock')
    .update({ filled_count: newCount, updated_at: new Date() })
    .eq('cylinder_type', cylinderType);
  
  if (updateError) throw updateError;
  
  return newCount;
};

const updateEmptyStock = async (cylinderType, quantity, operation = 'increase') => {
  const { data: current, error } = await supabase
    .from('stock')
    .select('empty_count')
    .eq('cylinder_type', cylinderType)
    .single();
  
  if (error) throw error;
  
  let newCount = current.empty_count;
  if (operation === 'increase') {
    newCount = current.empty_count + quantity;
  } else {
    newCount = current.empty_count - quantity;
  }
  
  if (newCount < 0) {
    throw new Error(`Insufficient empty stock for ${cylinderType}`);
  }
  
  const { error: updateError } = await supabase
    .from('stock')
    .update({ empty_count: newCount, updated_at: new Date() })
    .eq('cylinder_type', cylinderType);
  
  if (updateError) throw updateError;
  
  return newCount;
};

const checkFilledStock = async (cylinderType) => {
  const { data, error } = await supabase
    .from('stock')
    .select('filled_count')
    .eq('cylinder_type', cylinderType)
    .single();
  
  if (error) throw error;
  return data.filled_count > 0;
};

module.exports = {
  getStock,
  updateFilledStock,
  updateEmptyStock,
  checkFilledStock
};