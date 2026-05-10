// backend/controllers/refillController.js
const supabase = require('../config/database');
const stockService = require('../services/stockService');
const logger = require('../utils/logger');

const createRefill = async (req, res) => {
  try {
    const { 
      refillDate, 
      lokpriyaFilled, lokpriyaEmpty,
      sugamFilled, sugamEmpty,
      everestFilled, everestEmpty,
      otherFilled, otherEmpty,
      notes,
      mode,
      exchange_give_lokpriya,
      exchange_give_sugam,
      exchange_give_everest,
      exchange_give_other,
      exchange_take_lokpriya,
      exchange_take_sugam,
      exchange_take_everest,
      exchange_take_other
    } = req.body;

    // Validate stock for exchange mode
    if (mode === 'exchange') {
      const cylinders = [
        { name: 'लोकप्रिय', take: Number(exchange_take_lokpriya) || 0 },
        { name: 'सुगम', take: Number(exchange_take_sugam) || 0 },
        { name: 'एभरेस्ट', take: Number(exchange_take_everest) || 0 },
        { name: 'अन्य / Other', take: Number(exchange_take_other) || 0 }
      ];
      
      for (const cyl of cylinders) {
        if (cyl.take > 0) {
          const { data: stock } = await supabase
            .from('stock')
            .select('empty_count')
            .eq('cylinder_type', cyl.name)
            .single();
          
          const currentEmpty = stock?.empty_count || 0;
          if (cyl.take > currentEmpty) {
            return res.status(400).json({ 
              success: false, 
              message: `${cyl.name} को खाली स्टक छैन (उपलब्ध: ${currentEmpty}, चाहिने: ${cyl.take})` 
            });
          }
        }
      }
    } else {
      // Validate stock for normal mode
      const cylinders = [
        { name: 'लोकप्रिय', take: Number(lokpriyaEmpty) || 0 },
        { name: 'सुगम', take: Number(sugamEmpty) || 0 },
        { name: 'एभरेस्ट', take: Number(everestEmpty) || 0 },
        { name: 'अन्य / Other', take: Number(otherEmpty) || 0 }
      ];
      
      for (const cyl of cylinders) {
        if (cyl.take > 0) {
          const { data: stock } = await supabase
            .from('stock')
            .select('empty_count')
            .eq('cylinder_type', cyl.name)
            .single();
          
          const currentEmpty = stock?.empty_count || 0;
          if (cyl.take > currentEmpty) {
            return res.status(400).json({ 
              success: false, 
              message: `${cyl.name} को खाली स्टक छैन (उपलब्ध: ${currentEmpty}, चाहिने: ${cyl.take})` 
            });
          }
        }
      }
    }
    
    // Insert refill record
    const insertData = {
      refill_date: refillDate,
      notes: notes || null,
      mode: mode || 'normal'
    };
    
    if (mode === 'exchange') {
      Object.assign(insertData, {
        exchange_give_lokpriya: Number(exchange_give_lokpriya) || 0,
        exchange_give_sugam: Number(exchange_give_sugam) || 0,
        exchange_give_everest: Number(exchange_give_everest) || 0,
        exchange_give_other: Number(exchange_give_other) || 0,
        exchange_take_lokpriya: Number(exchange_take_lokpriya) || 0,
        exchange_take_sugam: Number(exchange_take_sugam) || 0,
        exchange_take_everest: Number(exchange_take_everest) || 0,
        exchange_take_other: Number(exchange_take_other) || 0,
        lokpriya_filled: 0, lokpriya_empty: 0,
        sugam_filled: 0, sugam_empty: 0,
        everest_filled: 0, everest_empty: 0,
        other_filled: 0, other_empty: 0
      });
    } else {
      Object.assign(insertData, {
        lokpriya_filled: Number(lokpriyaFilled) || 0,
        lokpriya_empty: Number(lokpriyaEmpty) || 0,
        sugam_filled: Number(sugamFilled) || 0,
        sugam_empty: Number(sugamEmpty) || 0,
        everest_filled: Number(everestFilled) || 0,
        everest_empty: Number(everestEmpty) || 0,
        other_filled: Number(otherFilled) || 0,
        other_empty: Number(otherEmpty) || 0,
        exchange_give_lokpriya: 0, exchange_give_sugam: 0,
        exchange_give_everest: 0, exchange_give_other: 0,
        exchange_take_lokpriya: 0, exchange_take_sugam: 0,
        exchange_take_everest: 0, exchange_take_other: 0
      });
    }
    
    const { error: insertError } = await supabase
      .from('dealer_refills')
      .insert([insertData]);
    
    if (insertError) throw insertError;
    
    // Update stock
    if (mode === 'exchange') {
      const cylinders = [
        { name: 'लोकप्रिय', give: Number(exchange_give_lokpriya) || 0, take: Number(exchange_take_lokpriya) || 0 },
        { name: 'सुगम', give: Number(exchange_give_sugam) || 0, take: Number(exchange_take_sugam) || 0 },
        { name: 'एभरेस्ट', give: Number(exchange_give_everest) || 0, take: Number(exchange_take_everest) || 0 },
        { name: 'अन्य / Other', give: Number(exchange_give_other) || 0, take: Number(exchange_take_other) || 0 }
      ];
      
      for (const cyl of cylinders) {
        if (cyl.give !== 0 || cyl.take !== 0) {
          const { data: stock } = await supabase
            .from('stock')
            .select('empty_count')
            .eq('cylinder_type', cyl.name)
            .single();
          
          let newEmpty = (stock?.empty_count || 0) + cyl.give - cyl.take;
          
          if (stock) {
            await supabase
              .from('stock')
              .update({ empty_count: newEmpty, updated_at: new Date() })
              .eq('cylinder_type', cyl.name);
          }
        }
      }
    } else {
      const cylinders = [
        { name: 'लोकप्रिय', give: Number(lokpriyaFilled) || 0, take: Number(lokpriyaEmpty) || 0 },
        { name: 'सुगम', give: Number(sugamFilled) || 0, take: Number(sugamEmpty) || 0 },
        { name: 'एभरेस्ट', give: Number(everestFilled) || 0, take: Number(everestEmpty) || 0 },
        { name: 'अन्य / Other', give: Number(otherFilled) || 0, take: Number(otherEmpty) || 0 }
      ];
      
      for (const cyl of cylinders) {
        if (cyl.give !== 0 || cyl.take !== 0) {
          const { data: stock } = await supabase
            .from('stock')
            .select('filled_count, empty_count')
            .eq('cylinder_type', cyl.name)
            .single();
          
          let newFilled = (stock?.filled_count || 0) + cyl.give;
          let newEmpty = (stock?.empty_count || 0) - cyl.take;
          
          if (stock) {
            await supabase
              .from('stock')
              .update({ 
                filled_count: newFilled, 
                empty_count: newEmpty, 
                updated_at: new Date() 
              })
              .eq('cylinder_type', cyl.name);
          }
        }
      }
    }
    
    logger.info(`Refill recorded: ${mode === 'exchange' ? 'Exchange' : 'Normal'} mode`);
    
    res.json({ 
      success: true, 
      message: mode === 'exchange' ? 'खाली साटासाट सफलतापूर्वक रेकर्ड गरियो' : 'रिफिल सफलतापूर्वक रेकर्ड गरियो' 
    });
    
  } catch (error) {
    logger.error('Refill error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getRefills = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('dealer_refills')
      .select('*')
      .order('refill_date', { ascending: false });
    
    if (error) throw error;
    res.json({ success: true, refills: data || [] });
  } catch (error) {
    logger.error('Get refills error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createRefill, getRefills };