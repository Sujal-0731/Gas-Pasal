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
  // First, ensure stock record exists
  let { data: current, error } = await supabase
    .from('stock')
    .select('filled_count')
    .eq('cylinder_type', cylinderType)
    .maybeSingle(); // Use maybeSingle instead of single
  
  if (error) throw error;
  
  // If no record exists, create one with zero counts
  if (!current) {
    console.log(`Creating stock record for ${cylinderType}`);
    const { error: insertError } = await supabase
      .from('stock')
      .insert([{ 
        cylinder_type: cylinderType, 
        filled_count: 0, 
        empty_count: 0,
        updated_at: new Date() 
      }]);
    
    if (insertError) throw insertError;
    
    // Fetch the newly created record
    const { data: newRecord, error: fetchError } = await supabase
      .from('stock')
      .select('filled_count')
      .eq('cylinder_type', cylinderType)
      .single();
    
    if (fetchError) throw fetchError;
    current = newRecord;
  }
  
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
  // First, ensure stock record exists
  let { data: current, error } = await supabase
    .from('stock')
    .select('empty_count')
    .eq('cylinder_type', cylinderType)
    .maybeSingle();
  
  if (error) throw error;
  
  // If no record exists, create one with zero counts
  if (!current) {
    console.log(`Creating stock record for ${cylinderType}`);
    const { error: insertError } = await supabase
      .from('stock')
      .insert([{ 
        cylinder_type: cylinderType, 
        filled_count: 0, 
        empty_count: 0,
        updated_at: new Date() 
      }]);
    
    if (insertError) throw insertError;
    
    // Fetch the newly created record
    const { data: newRecord, error: fetchError } = await supabase
      .from('stock')
      .select('empty_count')
      .eq('cylinder_type', cylinderType)
      .single();
    
    if (fetchError) throw fetchError;
    current = newRecord;
  }
  
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
  try {
    const { data, error } = await supabase
      .from('stock')
      .select('filled_count')
      .eq('cylinder_type', cylinderType)
      .maybeSingle(); // Use maybeSingle instead of single
    
    if (error) {
      console.error('Stock check error:', error);
      return false;
    }
    
    // If no record exists, return false (no stock available)
    if (!data) {
      console.log(`No stock record found for ${cylinderType}, assuming 0 stock`);
      return false;
    }
    
    console.log(`Stock check for ${cylinderType}: ${data.filled_count} available`);
    return (data.filled_count || 0) > 0;
    
  } catch (error) {
    console.error('checkFilledStock error:', error);
    return false;
  }
};

const updateStock = async (cylinderType, stockData) => {
  const { data, error } = await supabase
    .from('stock')
    .update(stockData)
    .eq('cylinder_type', cylinderType)
    .select()
    .single();
  
  return { data, error };
};

module.exports = {
  getStock,
  updateFilledStock,
  updateEmptyStock,
  checkFilledStock,
  updateStock
};