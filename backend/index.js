// backend/index.js
process.env.TZ = 'Asia/Kathmandu';
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const logger = require('./utils/logger');

// Import routes
const authRoutes = require('./routes/authRoutes');
const customerRoutes = require('./routes/customerRoutes');
const queueRoutes = require('./routes/queueRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const stockRoutes = require('./routes/stockRoutes');
const refillRoutes = require('./routes/refillRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const adminRoutes = require('./routes/adminRoutes');
const app = express();
const PORT = process.env.PORT || 5000;

// Rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many requests, please try again later.' }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  }
}));
app.use('/api/', limiter);

// Health check (public)
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'API is running' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/refills', refillRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', adminRoutes);
// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ 
    success: false, 
    message: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message 
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`📍 Mode: ${process.env.NODE_ENV || 'development'}`);
});

/*process.env.TZ = 'Asia/Kathmandu';
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const logger = require('./utils/logger');
const { 
  login, 
  authenticate, 
  authorize, 
  changePassword, 
  getCurrentUser,
  logout 
} = require('./middleware/auth');
const { 
  validateCustomerInput, 
  validateTransactionInput ,
  validateDashboardRequest
} = require('./middleware/validate');

const app = express();
const PORT = process.env.PORT || 5000;
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: { success: false, message: 'Too many requests, please try again later.' }
});

app.use(cors());
app.use(express.json());
app.use('/api/', limiter);
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
app.post('/api/auth/login', login);
app.use('/api/', authenticate);
app.get('/api/auth/me', getCurrentUser);
app.post('/api/auth/change-password', changePassword);
app.post('/api/auth/logout', logout);

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);


app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'API is running' });
});

app.get('/api/dashboard', authenticate, limiter, validateDashboardRequest, async (req, res) => {
  try {
    // Get all transactions in one query (with customer info)
    const { data: transactions, error: transError } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50); // Get last 50 transactions
    
    if (transError) throw transError;
    
    // Get customers count
    const { count: totalCustomers, error: customerError } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true });
    
    // Get active queue count
    const { count: activeQueue, error: queueError } = await supabase
      .from('queue')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'waiting');
    
    // Get stock data
    const { data: stockData, error: stockError } = await supabase
      .from('stock')
      .select('*');
    
    // Calculate total filled and empty
    let totalFilled = 0;
    let totalEmpty = 0;
    const stock = {};
    
    if (stockData) {
      stockData.forEach(item => {
        totalFilled += item.filled_count || 0;
        totalEmpty += item.empty_count || 0;
        stock[item.cylinder_type] = { 
          filled: item.filled_count, 
          empty: item.empty_count 
        };
      });
    }
    
    // Calculate monthly sales (current month)
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const monthlySales = transactions?.filter(t => {
      const transDate = new Date(t.created_at);
      return transDate.getMonth() === currentMonth && 
             transDate.getFullYear() === currentYear &&
             t.filled_cylinder !== 'कोही छैन';
    }).length || 0;
    
    // Format recent transactions (only 5)
    const recentTransactions = (transactions || []).slice(0, 5).map(t => {
      const transDate = new Date(t.created_at);
      return {
        ...t,
        formatted_date: transDate.toLocaleDateString('ne-NP'),
        formatted_time: transDate.toLocaleTimeString('ne-NP', { hour: '2-digit', minute: '2-digit' })
      };
    });
    
    res.json({ 
      success: true, 
      data: {
        stats: {
          totalCustomers: totalCustomers || 0,
          activeQueue: activeQueue || 0,
          totalFilled,
          totalEmpty,
          monthlySales
        },
        stock,
        recentTransactions
      }
    });
    
  } catch (error) {
    logger.error('Dashboard error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});
// ========== CUSTOMER ROUTES ==========

app.get('/api/customers', authenticate, async (req, res) => {
  try {
    const { search } = req.query;
    let query = supabase.from('customers').select('*');
    if (search && search.trim() !== '') {
       query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`);
    }
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ success: true, data: data || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/customers', authenticate,limiter, validateCustomerInput,async (req, res) => {
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

app.post('/api/transactions',  authenticate, limiter, validateTransactionInput, async (req, res) => {
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
      const { data: queueData } = await supabase
        .from('queue')
        .select('queued_at')
        .eq('id', queueId)
        .single();
      
      queueDate = queueData?.queued_at;
      
      await supabase
        .from('queue')
        .update({
          status: 'completed',
          completed_at: new Date()
        })
        .eq('id', queueId);
    }
    
    // ========== STOCK VALIDATION (CHECK BEFORE TRANSACTION) ==========
    
    // Check if filled cylinder is in stock
    if (filledCylinder && filledCylinder !== 'कोही छैन') {
      const { data: stockCheck } = await supabase
        .from('stock')
        .select('filled_count')
        .eq('cylinder_type', filledCylinder)
        .single();
      
      if (!stockCheck || stockCheck.filled_count <= 0) {
        return res.status(400).json({ 
          success: false, 
          message: `${filledCylinder} को स्टक सकियो। कृपया पहिले रिफिल गर्नुहोस्।` 
        });
      }
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
    
    // 1. Handle Filled Cylinder (Customer takes filled cylinder)
    if (filledCylinder && filledCylinder !== 'कोही छैन') {
      const { data: stockFilled } = await supabase
        .from('stock')
        .select('filled_count')
        .eq('cylinder_type', filledCylinder)
        .single();
      
      if (stockFilled) {
        const newFilledCount = stockFilled.filled_count - 1;  // Removed Math.max
        await supabase
          .from('stock')
          .update({ filled_count: newFilledCount, updated_at: new Date() })
          .eq('cylinder_type', filledCylinder);
      }
    }
    
    // 2. Handle Empty Cylinder (Customer brings empty cylinder)
    if (emptyCylinder && emptyCylinder !== 'कोही छैन') {
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

app.get('/api/customers/:name/history', authenticate, async (req, res) => {
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
      const transDate = new Date(t.created_at);
      const formattedTransDate = transDate.toLocaleDateString('ne-NP');
      const formattedTransTime = transDate.toLocaleTimeString('ne-NP', { hour: '2-digit', minute: '2-digit' });
      
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

app.get('/api/stock', authenticate, async (req, res) => {
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

app.post('/api/refills', authenticate, async (req, res) => {
  try {
    const { 
      refillDate, 
      lokpriyaFilled, lokpriyaEmpty,
      sugamFilled, sugamEmpty,
      everestFilled, everestEmpty,
      notes,
      mode,
      otherFilled, otherEmpty,
      exchange_give_lokpriya,
      exchange_give_sugam,
      exchange_give_everest,
      exchange_give_other,
      exchange_take_lokpriya,
      exchange_take_sugam,
      exchange_take_everest,
      exchange_take_other
    } = req.body;

    logger.info('=== REFILL DATA RECEIVED ===');
    logger.info('Mode:', mode || 'normal');
    
    // ========== STEP 1: VALIDATE STOCK (BEFORE INSERTING ANYTHING) ==========
    if (mode === 'exchange') {
      // EXCHANGE MODE VALIDATION
      logger.info('\n🔍 Validating stock for EXCHANGE mode...');
      
      const cylinders = [
        { name: 'लोकप्रिय', take: Number(exchange_take_lokpriya) || 0 },
        { name: 'सुगम', take: Number(exchange_take_sugam) || 0 },
        { name: 'एभरेस्ट', take: Number(exchange_take_everest) || 0 },
        { name: 'अन्य / Other', take: Number(exchange_take_other) || 0 }
      ];
      
      for (const cyl of cylinders) {
        if (cyl.take === 0) continue;
        
        const { data: stock, error: stockError } = await supabase
          .from('stock')
          .select('empty_count')
          .eq('cylinder_type', cyl.name)
          .single();
        
        const currentEmpty = stock?.empty_count || 0;
        
        if (cyl.take > currentEmpty) {
          logger.error(`❌ Stock validation failed for ${cyl.name}`);
          return res.status(400).json({ 
            success: false, 
            message: `${cyl.name} को खाली स्टक छैन (उपलब्ध: ${currentEmpty}, चाहिने: ${cyl.take})` 
          });
        }
        
        logger.info(`✅ ${cyl.name}: Available ${currentEmpty}, Need to give ${cyl.take} - OK`);
      }
      
    } else {
      // NORMAL MODE VALIDATION
      logger.info('\n🔍 Validating stock for NORMAL mode...');
      
      const cylinders = [
        { name: 'लोकप्रिय', take: Number(lokpriyaEmpty) || 0 },
        { name: 'सुगम', take: Number(sugamEmpty) || 0 },
        { name: 'एभरेस्ट', take: Number(everestEmpty) || 0 },
        { name: 'अन्य / Other', take: Number(otherEmpty) || 0 }
      ];
      
      for (const cyl of cylinders) {
        if (cyl.take === 0) continue;
        
        const { data: stock, error: stockError } = await supabase
          .from('stock')
          .select('empty_count')
          .eq('cylinder_type', cyl.name)
          .single();
        
        const currentEmpty = stock?.empty_count || 0;
        
        if (cyl.take > currentEmpty) {
          logger.error(`❌ Stock validation failed for ${cyl.name}`);
          return res.status(400).json({ 
            success: false, 
            message: `${cyl.name} को खाली स्टक छैन (उपलब्ध: ${currentEmpty}, चाहिने: ${cyl.take})` 
          });
        }
        
        logger.info(`✅ ${cyl.name}: Available ${currentEmpty}, Need to give ${cyl.take} - OK`);
      }
    }
    
    // ========== STEP 2: INSERT REFILL RECORD (ONLY IF STOCK IS SUFFICIENT) ==========
    logger.info('\n✅ Stock validation passed. Inserting refill record...');
    
    const insertData = {
      refill_date: refillDate,
      notes: notes || null,
      mode: mode || 'normal'
    };
    
    if (mode === 'exchange') {
      insertData.exchange_give_lokpriya = Number(exchange_give_lokpriya) || 0;
      insertData.exchange_give_sugam = Number(exchange_give_sugam) || 0;
      insertData.exchange_give_everest = Number(exchange_give_everest) || 0;
      insertData.exchange_give_other = Number(exchange_give_other) || 0;
      insertData.exchange_take_lokpriya = Number(exchange_take_lokpriya) || 0;
      insertData.exchange_take_sugam = Number(exchange_take_sugam) || 0;
      insertData.exchange_take_everest = Number(exchange_take_everest) || 0;
      insertData.exchange_take_other = Number(exchange_take_other) || 0;
      insertData.lokpriya_filled = 0;
      insertData.lokpriya_empty = 0;
      insertData.sugam_filled = 0;
      insertData.sugam_empty = 0;
      insertData.everest_filled = 0;
      insertData.everest_empty = 0;
      insertData.other_filled = 0;
      insertData.other_empty = 0;
    } else {
      insertData.lokpriya_filled = Number(lokpriyaFilled) || 0;
      insertData.lokpriya_empty = Number(lokpriyaEmpty) || 0;
      insertData.sugam_filled = Number(sugamFilled) || 0;
      insertData.sugam_empty = Number(sugamEmpty) || 0;
      insertData.everest_filled = Number(everestFilled) || 0;
      insertData.everest_empty = Number(everestEmpty) || 0;
      insertData.other_filled = Number(otherFilled) || 0;
      insertData.other_empty = Number(otherEmpty) || 0;
      insertData.exchange_give_lokpriya = 0;
      insertData.exchange_give_sugam = 0;
      insertData.exchange_give_everest = 0;
      insertData.exchange_give_other = 0;
      insertData.exchange_take_lokpriya = 0;
      insertData.exchange_take_sugam = 0;
      insertData.exchange_take_everest = 0;
      insertData.exchange_take_other = 0;
    }
    
    const { error: insertError } = await supabase
      .from('dealer_refills')
      .insert([insertData]);
    
    if (insertError) {
      logger.error('Insert error:', insertError);
      throw insertError;
    }
    
    logger.info('✅ Refill record inserted');
    
    // ========== STEP 3: UPDATE STOCK ==========
    if (mode === 'exchange') {
      logger.info('\n🔄 Updating stock for EXCHANGE mode...');
      
      const cylinders = [
        { name: 'लोकप्रिय', give: Number(exchange_give_lokpriya) || 0, take: Number(exchange_take_lokpriya) || 0 },
        { name: 'सुगम', give: Number(exchange_give_sugam) || 0, take: Number(exchange_take_sugam) || 0 },
        { name: 'एभरेस्ट', give: Number(exchange_give_everest) || 0, take: Number(exchange_take_everest) || 0 },
        { name: 'अन्य / Other', give: Number(exchange_give_other) || 0, take: Number(exchange_take_other) || 0 }
      ];
      
      for (const cyl of cylinders) {
        if (cyl.give === 0 && cyl.take === 0) continue;
        
        const { data: stock, error: stockError } = await supabase
          .from('stock')
          .select('empty_count')
          .eq('cylinder_type', cyl.name)
          .single();
        
        let currentEmpty = stock?.empty_count || 0;
        let newEmpty = currentEmpty + cyl.give - cyl.take;
        
        logger.info(`   ${cyl.name}: ${currentEmpty} + ${cyl.give} - ${cyl.take} = ${newEmpty}`);
        
        if (stock) {
          await supabase
            .from('stock')
            .update({ empty_count: newEmpty, updated_at: new Date() })
            .eq('cylinder_type', cyl.name);
        } else {
          await supabase
            .from('stock')
            .insert([{ cylinder_type: cyl.name, empty_count: newEmpty, filled_count: 0, updated_at: new Date() }]);
        }
      }
      
    } else {
      logger.info('\n🔄 Updating stock for NORMAL mode...');
      
      const cylinders = [
        { name: 'लोकप्रिय', give: Number(lokpriyaFilled) || 0, take: Number(lokpriyaEmpty) || 0 },
        { name: 'सुगम', give: Number(sugamFilled) || 0, take: Number(sugamEmpty) || 0 },
        { name: 'एभरेस्ट', give: Number(everestFilled) || 0, take: Number(everestEmpty) || 0 },
        { name: 'अन्य / Other', give: Number(otherFilled) || 0, take: Number(otherEmpty) || 0 }
      ];
      
      for (const cyl of cylinders) {
        if (cyl.give === 0 && cyl.take === 0) continue;
        
        const { data: stock, error: stockError } = await supabase
          .from('stock')
          .select('filled_count, empty_count')
          .eq('cylinder_type', cyl.name)
          .single();
        
        let currentFilled = stock?.filled_count || 0;
        let currentEmpty = stock?.empty_count || 0;
        let newFilled = currentFilled + cyl.give;
        let newEmpty = currentEmpty - cyl.take;
        
        logger.info(`   ${cyl.name}: Filled ${currentFilled}→${newFilled}, Empty ${currentEmpty}→${newEmpty}`);
        
        if (stock) {
          await supabase
            .from('stock')
            .update({ filled_count: newFilled, empty_count: newEmpty, updated_at: new Date() })
            .eq('cylinder_type', cyl.name);
        } else {
          await supabase
            .from('stock')
            .insert([{ cylinder_type: cyl.name, filled_count: newFilled, empty_count: newEmpty, updated_at: new Date() }]);
        }
      }
    }
    
    logger.info('\n✅ REFILL COMPLETED SUCCESSFULLY');
    res.json({ success: true, message: mode === 'exchange' ? 'खाली साटासाट सफलतापूर्वक रेकर्ड गरियो' : 'रिफिल सफलतापूर्वक रेकर्ड गरियो' });
    
  } catch (error) {
    logger.error('❌ Dealer refill error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});
app.get('/api/refills', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase.from('dealer_refills').select('*').order('refill_date', { ascending: false });
    if (error) throw error;
    res.json({ success: true, refills: data || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== QUEUE ROUTES ==========

app.get('/api/queue', authenticate, async (req, res) => {
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

app.post('/api/queue', authenticate, async (req, res) => {
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
    
    res.json({ success: true, message: 'Added to queue', data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.delete('/api/queue/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    // First, get the queue item to know which empty cylinder to adjust
    const { data: queueItem, error: fetchError } = await supabase
      .from('queue')
      .select('empty_cylinder')
      .eq('id', id)
      .single();
    
    if (fetchError) throw fetchError;
    
    // Decrease empty stock (customer is taking back their empty cylinder)
    if (queueItem && queueItem.empty_cylinder && queueItem.empty_cylinder !== 'कोही छैन') {
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
    res.json({ success: true, message: 'Removed from queue' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.listen(PORT, () => {
  if (process.env.NODE_ENV !== 'production') {
    logger.info(`🚀 Server running on port ${PORT}`);
    logger.info(`📍 Mode: ${process.env.NODE_ENV || 'development'}`);
  } else {
    logger.info(`🚀 Server running in production mode on port ${PORT}`);
  }
});
*/