// backend/controllers/dashboardController.js
const supabase = require('../config/database');
const stockService = require('../services/stockService');
const logger = require('../utils/logger');

const getDashboard = async (req, res) => {
  try {
    // Get transactions
    const { data: transactions, error: transError } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false });
    
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
    
    // Get stock
    const stock = await stockService.getStock();
    
    // Calculate totals
    let totalFilled = 0;
    let totalEmpty = 0;
    Object.values(stock).forEach(s => {
      totalFilled += s.filled || 0;
      totalEmpty += s.empty || 0;
    });
    
    // Calculate monthly sales
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const monthlySales = transactions?.filter(t => {
      const isoString = t.created_at.replace(' ', 'T').replace(/(\+\d{2})$/, '$1:00');
      const transDate = new Date(isoString);  
      return transDate.getMonth() === currentMonth && 
            transDate.getFullYear() === currentYear &&
            t.filled_cylinder !== 'कोही छैन';
    }).length || 0;
    console.log(monthlySales);
    
    // Format recent transactions
    const recentTransactions = (transactions || []).slice(0, 30).map(t => {
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
};

module.exports = { getDashboard };