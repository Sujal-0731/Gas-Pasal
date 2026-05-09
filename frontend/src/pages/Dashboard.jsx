import React, { useState, useEffect } from 'react';
import { StockProgress } from '../components/dashboard/StockProgress';
import { 
  IconDashboardHome,
  IconUsers, 
  IconPackage, 
  IconClock, 
  IconTrendingUp,
  IconTransaction,
  IconQueue,
  IconNewCustomer,
  IconFilledCylinder,
  IconEmptyCylinder,
  IconReturn,
  IconNewPurchase
} from '../components/icons';

const API_URL = import.meta.env.VITE_API_URL;
const PIN_CODE = import.meta.env.VITE_PIN_CODE;

export function Dashboard({ showToast, onNavigate }) {
  const [stats, setStats] = useState({
    totalCustomers: 0,
    activeQueue: 0,
    totalFilled: 0,
    totalEmpty: 0,
    monthlySales: 0,
  });
  const [stock, setStock] = useState({});
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [customersRes, stockRes, queueRes] = await Promise.all([
        fetch(`${API_URL}/customers`, { headers: { 'x-pin': PIN_CODE } }),
        fetch(`${API_URL}/stock`, { headers: { 'x-pin': PIN_CODE } }),
        fetch(`${API_URL}/queue`, { headers: { 'x-pin': PIN_CODE } }),
      ]);

      const customersData = await customersRes.json();
      const stockData = await stockRes.json();
      const queueData = await queueRes.json();

      let totalFilled = 0;
      let totalEmpty = 0;
      if (stockData.success && stockData.stock) {
        Object.values(stockData.stock).forEach(s => {
          totalFilled += s.filled || 0;
          totalEmpty += s.empty || 0;
        });
      }

      const customers = customersData.success ? customersData.data : [];
      
      let allTransactions = [];
      for (const customer of customers) {
        try {
          const transRes = await fetch(`${API_URL}/customers/${encodeURIComponent(customer.name)}/history`, {
            headers: { 'x-pin': PIN_CODE }
          });
          const transData = await transRes.json();
          if (transData.success && transData.transactions) {
            allTransactions = [...allTransactions, ...transData.transactions];
          }
        } catch (err) {
          console.error(`Error fetching transactions for ${customer.name}:`, err);
        }
      }

      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      const currentMonthSales = allTransactions.filter(t => {
        const transDate = new Date(t.created_at);
        return transDate.getMonth() === currentMonth && 
               transDate.getFullYear() === currentYear &&
               t.filled_cylinder !== 'कोही छैन';
      }).length;

      allTransactions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      const recentTransactionsList = allTransactions.slice(0, 5);

      setStats({
        totalCustomers: customers.length,
        activeQueue: queueData.success ? queueData.queue.length : 0,
        totalFilled: totalFilled,
        totalEmpty: totalEmpty,
        monthlySales: currentMonthSales,
      });
      
      setStock(stockData.success ? stockData.stock : {});
      setRecentTransactions(recentTransactionsList);
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      if (showToast) showToast('डाटा लोड गर्न असफल', 'error');
    }
    setLoading(false);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ne-NP');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-base">डाटा लोड हुँदै...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-20">
      {/* Page Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900">📊 ड्यासबोर्ड</h1>
        <p className="text-sm text-gray-500 mt-1">वास्तविक तथ्याङ्क</p>
      </div>

      {/* Stats Grid - Larger cards with bigger text */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">कुल ग्राहक</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalCustomers}</p>
            </div>
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <IconUsers className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">भरिएको स्टक</p>
              <p className="text-2xl font-bold text-green-600">{stats.totalFilled}</p>
            </div>
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <IconPackage className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">खाली स्टक</p>
              <p className="text-2xl font-bold text-red-600">{stats.totalEmpty}</p>
            </div>
            <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
              <IconClock className="w-5 h-5 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">यो महिनाको बिक्री</p>
              <p className="text-2xl font-bold text-orange-600">{stats.monthlySales}</p>
            </div>
            <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
              <IconTrendingUp className="w-5 h-5 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Stock Overview - Larger text */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">स्टक अवस्था</h3>
          <button 
            onClick={() => onNavigate?.('stock')}
            className="text-sm text-blue-600 font-medium"
          >
            विवरण →
          </button>
        </div>
        
        <StockProgress stock={stock} />
      </div>

      {/* Quick Actions - Larger buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => onNavigate?.('exchange')}
          className="bg-gray-100 text-gray-700 py-4 rounded-xl font-medium text-base active:bg-gray-200 transition flex items-center justify-center gap-2"
        >
          <IconTransaction className="w-5 h-5 text-gray-500" />
          नयाँ लेनदेन
        </button>
        <button
          onClick={() => onNavigate?.('queue')}
          className="bg-gray-100 text-gray-700 py-4 rounded-xl font-medium text-base active:bg-gray-200 transition flex items-center justify-center gap-2"
        >
          <IconQueue className="w-5 h-5 text-gray-500" />
          क्यू ({stats.activeQueue})
        </button>
        <button
          onClick={() => onNavigate?.('customers')}
          className="bg-gray-100 text-gray-700 py-4 rounded-xl font-medium text-base active:bg-gray-200 transition flex items-center justify-center gap-2 col-span-2"
        >
          <IconNewCustomer className="w-5 h-5 text-gray-500" />
          नयाँ ग्राहक
        </button>
      </div>

      {/* Recent Transactions - Larger text */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">हालैको लेनदेन</h3>
          <button 
            onClick={() => onNavigate?.('exchange')}
            className="text-sm text-blue-600 font-medium"
          >
            सबै →
          </button>
        </div>
        
        {recentTransactions.length === 0 ? (
          <div className="text-center text-gray-400 text-base py-6">कुनै लेनदेन छैन</div>
        ) : (
          <div className="space-y-3">
            {recentTransactions.map((transaction, idx) => (
              <div key={idx} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-base font-medium text-gray-900">{transaction.customer_name}</p>
                  <p className="text-xs text-gray-400 mt-1">{formatDate(transaction.created_at)}</p>
                </div>
                <div className="text-right">
                  {/* Filled Cylinder */}
                  {transaction.filled_cylinder !== 'कोही छैन' ? (
                    <div className="flex items-center gap-1 justify-end">
                      <IconFilledCylinder className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-green-600">
                        {transaction.filled_cylinder}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 justify-end">
                      <IconReturn className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-600">फिर्ता</span>
                    </div>
                  )}
                  
                  {/* Empty Cylinder */}
                  {transaction.empty_cylinder !== 'कोही छैन' ? (
                    <div className="flex items-center gap-1 justify-end mt-1">
                      <IconEmptyCylinder className="w-4 h-4 text-red-500" />
                      <span className="text-xs text-red-500">
                        {transaction.empty_cylinder}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 justify-end mt-1">
                      <IconNewPurchase className="w-4 h-4 text-orange-500" />
                      <span className="text-xs text-orange-500">नयाँ खरिद</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}