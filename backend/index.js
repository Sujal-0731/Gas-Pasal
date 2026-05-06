require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

function verifyPin(req, res, next) {
  const pin = req.headers['x-pin'];
  if (pin === process.env.PIN_CODE) {
    next();
  } else {
    res.status(401).json({ success: false, message: 'Invalid PIN' });
  }
}

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'API is running' });
});

// ========== CUSTOMER ROUTES ==========

// Get all customers
app.get('/api/customers', verifyPin, async (req, res) => {
  try {
    const { search } = req.query;
    let query = supabase.from('customers').select('*');
    if (search && search.trim() !== '') {
      query = query.ilike('name', `%${search}%`);
    }
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ success: true, data: data || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add new customer
app.post('/api/customers', verifyPin, async (req, res) => {
  try {
    const { name, phone, address, remarks } = req.body;
    if (!name || name.trim() === '') {
      return res.status(400).json({ success: false, message: 'Name is required' });
    }
    
    const { data: existing } = await supabase
      .from('customers')
      .select('id')
      .ilike('name', name.trim())
      .single();
    
    if (existing) {
      return res.json({ success: true, message: 'Customer already exists', data: existing });
    }
    
    const { data: allCustomers } = await supabase.from('customers').select('customer_id');
    let nextNum = 1;
    if (allCustomers && allCustomers.length > 0) {
      const numbers = allCustomers.map(c => parseInt(c.customer_id.replace('CUST', '')) || 0);
      nextNum = Math.max(...numbers) + 1;
    }
    const customerId = 'CUST' + String(nextNum).padStart(3, '0');
    
    const { data, error } = await supabase
      .from('customers')
      .insert([{ 
        customer_id: customerId, 
        name: name.trim(), 
        phone: phone || null, 
        address: address || null, 
        remarks: remarks || null 
      }])
      .select()
      .single();
    
    if (error) throw error;
    res.json({ success: true, message: 'Customer added successfully', data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== TRANSACTION ROUTES ==========

// Add transaction AND update stock
app.post('/api/transactions', verifyPin, async (req, res) => {
  try {
    const { customerName, emptyCylinder, filledCylinder, remarks, queueId } = req.body;
    
    if (!customerName || customerName.trim() === '') {
      return res.status(400).json({ success: false, message: 'Customer name is required' });
    }
    
    // Find customer
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id')
      .ilike('name', customerName.trim())
      .single();
    
    if (customerError || !customer) {
      return res.status(404).json({ success: false, message: 'Customer not found. Please register first.' });
    }
    
    // Get next transaction ID
    const { data: allTransactions } = await supabase.from('transactions').select('transaction_id');
    let nextNum = 1;
    if (allTransactions && allTransactions.length > 0) {
      const numbers = allTransactions.map(t => parseInt(t.transaction_id.replace('TR', '')) || 0);
      nextNum = Math.max(...numbers) + 1;
    }
    const transactionId = 'TR' + String(nextNum).padStart(5, '0');
    
    // Determine source and get queue date if from queue
    let source = 'direct';
    let queueDate = null;
    
    if (queueId) {
      source = 'queue';
      // Get the original queued date
      const { data: queueData } = await supabase
        .from('queue')
        .select('queued_at')
        .eq('id', queueId)
        .single();
      
      queueDate = queueData?.queued_at;
      
      // Mark queue as completed
      await supabase
        .from('queue')
        .update({
          status: 'completed',
          completed_at: new Date()
        })
        .eq('id', queueId);
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
    
    // ========== UPDATE STOCK FROM TRANSACTION ==========
    // 1. Decrease Filled stock (customer took a filled cylinder)
    if (filledCylinder) {
      const { data: stockFilled } = await supabase
        .from('stock')
        .select('filled_count')
        .eq('cylinder_type', filledCylinder)
        .single();
      
      if (stockFilled) {
        const newFilledCount = Math.max(0, stockFilled.filled_count - 1);
        await supabase
          .from('stock')
          .update({ filled_count: newFilledCount, updated_at: new Date() })
          .eq('cylinder_type', filledCylinder);
      }
    }
    
    // 2. Increase Empty stock (customer brought an empty cylinder)
    if (emptyCylinder) {
      const { data: stockEmpty } = await supabase
        .from('stock')
        .select('empty_count')
        .eq('cylinder_type', emptyCylinder)
        .single();
      
      if (stockEmpty) {
        const newEmptyCount = (stockEmpty.empty_count || 0) + 1;
        await supabase
          .from('stock')
          .update({ empty_count: newEmptyCount, updated_at: new Date() })
          .eq('cylinder_type', emptyCylinder);
      }
    }
    
    res.json({ success: true, message: 'Transaction recorded successfully', data });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get customer history
app.get('/api/customers/:name/history', verifyPin, async (req, res) => {
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
      // Format transaction date
      const transDate = new Date(t.created_at);
      const formattedTransDate = transDate.toLocaleDateString('ne-NP');
      const formattedTransTime = transDate.toLocaleTimeString('ne-NP', { hour: '2-digit', minute: '2-digit' });
      
      // Format queue date if exists
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
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== STOCK ROUTES ==========

// Get stock
app.get('/api/stock', verifyPin, async (req, res) => {
  try {
    const { data, error } = await supabase.from('stock').select('*').order('cylinder_type');
    if (error) throw error;
    const stock = {};
    (data || []).forEach(item => {
      stock[item.cylinder_type] = { filled: item.filled_count, empty: item.empty_count };
    });
    res.json({ success: true, stock });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== DEALER REFILL ROUTES ==========

// Add dealer refill
app.post('/api/refills', verifyPin, async (req, res) => {
  try {
    const { 
      refillDate, 
      lokpriyaFilled, lokpriyaEmpty,
      sugamFilled, sugamEmpty,
      everestFilled, everestEmpty,
      notes 
    } = req.body;
    
    // Insert refill record
    const { error } = await supabase.from('dealer_refills').insert([{
      refill_date: refillDate,
      lokpriya_filled: lokpriyaFilled || 0,
      lokpriya_empty: lokpriyaEmpty || 0,
      sugam_filled: sugamFilled || 0,
      sugam_empty: sugamEmpty || 0,
      everest_filled: everestFilled || 0,
      everest_empty: everestEmpty || 0,
      notes: notes || null
    }]);
    
    if (error) throw error;
    
    // Update stock based on refill
    const cylinders = [
      { name: 'लोकप्रिय', filled: lokpriyaFilled || 0, empty: lokpriyaEmpty || 0 },
      { name: 'सुगम', filled: sugamFilled || 0, empty: sugamEmpty || 0 },
      { name: 'एभरेस्ट', filled: everestFilled || 0, empty: everestEmpty || 0 }
    ];
    
    for (const cyl of cylinders) {
      if (cyl.filled !== 0) {
        const { data: current } = await supabase
          .from('stock')
          .select('filled_count')
          .eq('cylinder_type', cyl.name)
          .single();
        
        if (current) {
          const newFilledCount = Math.max(0, (current.filled_count || 0) + cyl.filled);
          await supabase
            .from('stock')
            .update({ filled_count: newFilledCount, updated_at: new Date() })
            .eq('cylinder_type', cyl.name);
        }
      }
      
      if (cyl.empty !== 0) {
        const { data: current } = await supabase
          .from('stock')
          .select('empty_count')
          .eq('cylinder_type', cyl.name)
          .single();
        
        if (current) {
          const newEmptyCount = Math.max(0, (current.empty_count || 0) - cyl.empty);
          await supabase
            .from('stock')
            .update({ empty_count: newEmptyCount, updated_at: new Date() })
            .eq('cylinder_type', cyl.name);
        }
      }
    }
    
    res.json({ success: true, message: 'Dealer refill recorded successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get dealer refills
app.get('/api/refills', verifyPin, async (req, res) => {
  try {
    const { data, error } = await supabase.from('dealer_refills').select('*').order('refill_date', { ascending: false });
    if (error) throw error;
    res.json({ success: true, refills: data || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== QUEUE ROUTES ==========

// Get waiting queue
app.get('/api/queue', verifyPin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('queue')
      .select('*')
      .eq('status', 'waiting')
      .order('queued_at', { ascending: true });
    
    if (error) throw error;
    res.json({ success: true, queue: data || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add to queue
app.post('/api/queue', verifyPin, async (req, res) => {
  try {
    const { customerId, customerName, emptyCylinder, notes } = req.body;
    
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
    
    // Increase empty stock
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
    
    res.json({ success: true, message: 'Added to queue', data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Remove from queue (mark completed)
app.delete('/api/queue/:id', verifyPin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const { error } = await supabase
      .from('queue')
      .update({
        status: 'completed',
        completed_at: new Date()
      })
      .eq('id', id);
    
    if (error) throw error;
    res.json({ success: true, message: 'Removed from queue' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 PIN Code: ${process.env.PIN_CODE}`);
});