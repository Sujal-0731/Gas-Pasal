// backend/controllers/queueController.js
const supabase = require('../config/database');
const logger = require('../utils/logger');

// Get all active queue items
const getQueue = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('queue')
      .select('*')
      .eq('status', 'waiting')
      .order('queued_at', { ascending: true });
    
    if (error) throw error;
    
    res.json({ success: true, queue: data || [] });
  } catch (error) {
    logger.error('Get queue error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Add customer to queue
const addToQueue = async (req, res) => {
  try {
    const { customerId, customerName, emptyCylinder, notes } = req.body;
    
    // Insert into queue
    const { data, error } = await supabase
      .from('queue')
      .insert([{
        customer_id: customerId,
        customer_name: customerName,
        empty_cylinder: emptyCylinder,
        notes: notes || null,
        status: 'waiting',
        queued_at: new Date()
      }])
      .select();
    
    if (error) throw error;
    
    // Increase empty stock (only if it's a real cylinder, not 'कोही छैन')
    if (emptyCylinder && emptyCylinder !== 'कोही छैन') {
      const { data: stockData } = await supabase
        .from('stock')
        .select('empty_count')
        .eq('cylinder_type', emptyCylinder)
        .single();
      
      if (stockData) {
        await supabase
          .from('stock')
          .update({
            empty_count: (stockData.empty_count || 0) + 1,
            updated_at: new Date()
          })
          .eq('cylinder_type', emptyCylinder);
      }
    }
    
    logger.info(`Customer added to queue: ${customerName} (${emptyCylinder})`);
    
    res.json({ 
      success: true, 
      message: 'Added to queue', 
      data: data?.[0] 
    });
    
  } catch (error) {
    logger.error('Add to queue error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Remove customer from queue
const removeFromQueue = async (req, res) => {
  try {
    const { id } = req.params;
    
    // First, get the queue item to know which empty cylinder to adjust
    const { data: queueItem, error: fetchError } = await supabase
      .from('queue')
      .select('empty_cylinder, customer_name')
      .eq('id', id)
      .single();
    
    if (fetchError) throw fetchError;
    
    if (!queueItem) {
      return res.status(404).json({ 
        success: false, 
        message: 'Queue item not found' 
      });
    }
    
    // Decrease empty stock (customer is taking back their empty cylinder)
    if (queueItem.empty_cylinder && queueItem.empty_cylinder !== 'कोही छैन') {
      const { data: stockData } = await supabase
        .from('stock')
        .select('empty_count')
        .eq('cylinder_type', queueItem.empty_cylinder)
        .single();
      
      if (stockData) {
        const newEmptyCount = Math.max(0, (stockData.empty_count || 0) - 1);
        await supabase
          .from('stock')
          .update({ 
            empty_count: newEmptyCount, 
            updated_at: new Date() 
          })
          .eq('cylinder_type', queueItem.empty_cylinder);
      }
    }
    
    // Delete the queue record
    const { error } = await supabase
      .from('queue')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    logger.info(`Customer removed from queue: ${queueItem.customer_name}`);
    
    res.json({ 
      success: true, 
      message: 'Removed from queue' 
    });
    
  } catch (error) {
    logger.error('Remove from queue error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get queue count (for dashboard)
const getQueueCount = async (req, res) => {
  try {
    const { count, error } = await supabase
      .from('queue')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'waiting');
    
    if (error) throw error;
    
    res.json({ success: true, count: count || 0 });
  } catch (error) {
    logger.error('Get queue count error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get single queue item (for processing)
const getQueueItem = async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabase
      .from('queue')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    
    if (!data) {
      return res.status(404).json({ 
        success: false, 
        message: 'Queue item not found' 
      });
    }
    
    res.json({ success: true, data });
  } catch (error) {
    logger.error('Get queue item error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getQueue,
  addToQueue,
  removeFromQueue,
  getQueueCount,
  getQueueItem
};