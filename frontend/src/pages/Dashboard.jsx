import { useState, useEffect, useCallback } from 'react';
import { StockProgress } from '../components/dashboard/StockProgress';
import { 
  IconDashboardHome,
  IconUsers, 
  IconTrendingUp,
  IconTransaction,
  IconQueue,
  IconFilledCylinder,
  IconEmptyCylinder,
  IconReturn,
  IconNewPurchase,
  IconDashboard
} from '../components/icons';
import { useLanguage } from '../context/LanguageContext';
import { t } from '../utils/translations';
import { translateCylinder } from '../utils/cylinderTranslator';

const API_URL = import.meta.env.VITE_API_URL;

export function Dashboard({ showToast, onNavigate }) {
  const { language } = useLanguage();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ Wrap with useCallback to prevent recreation on every render
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/dashboard`, {
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success) {
        setDashboardData(data.data);
      } else {
        throw new Error(data.message);
      }
    } catch {
      console.error('Error fetching dashboard data');
      if (showToast) showToast(t('error', language), 'error');
    }
    setLoading(false);
  }, [showToast, language]);

  // ✅ Add fetchDashboardData to dependency array
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ne-NP');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 text-lg font-medium">{t('loading', language)}</p>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="text-center py-16">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <IconDashboard className="w-10 h-10 text-gray-400" />
        </div>
        <p className="text-gray-500 text-lg">{t('noData', language)}</p>
        <button 
          onClick={fetchDashboardData}
          className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          {t('refresh', language)}
        </button>
      </div>
    );
  }

  const { stats, stock, recentTransactions } = dashboardData;

  return (
    <div className="space-y-6 pb-24">
      <div className="bg-gradient-to-r from-blue-700 to-blue-500 rounded-2xl p-6 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <IconDashboardHome className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">{t('dashboard', language)}</h1>
            <p className="text-blue-100 text-base mt-1">{t('welcome', language)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-md border border-gray-100 hover:shadow-lg transition">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <IconUsers className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-3xl font-bold text-gray-800">{stats.totalCustomers}</span>
          </div>
          <p className="text-gray-600 font-medium">{t('totalCustomers', language)}</p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-md border border-gray-100 hover:shadow-lg transition">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <IconQueue className="w-6 h-6 text-purple-600" />
            </div>
            <span className="text-3xl font-bold text-gray-800">{stats.activeQueue}</span>
          </div>
          <p className="text-gray-600 font-medium">{t('activeQueue', language)}</p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-md border border-gray-100 hover:shadow-lg transition">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <IconFilledCylinder className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-3xl font-bold text-green-700">{stats.totalFilled}</span>
          </div>
          <p className="text-gray-600 font-medium">{t('filledStock', language)}</p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-md border border-gray-100 hover:shadow-lg transition">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <IconEmptyCylinder className="w-6 h-6 text-red-500" />
            </div>
            <span className="text-3xl font-bold text-red-600">{stats.totalEmpty}</span>
          </div>
          <p className="text-gray-600 font-medium">{t('emptyStock', language)}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-md border border-gray-100 hover:shadow-lg transition">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm font-medium mb-1">{t('monthlySales', language)}</p>
            <p className="text-4xl md:text-5xl font-bold text-gray-800">{stats.monthlySales}</p>
            <p className="text-gray-400 text-sm mt-2">{t('cylinders', language)}</p>
          </div>
          <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center">
            <IconTrendingUp className="w-8 h-8 text-orange-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-700 to-blue-500 px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-bold text-white">{t('stockStatus', language)}</h3>
              <p className="text-blue-100 text-sm mt-0.5">{t('currentStockStatus', language)}</p>
            </div>
            <button 
              onClick={() => onNavigate?.('stock')}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-sm font-medium transition flex items-center gap-1"
            >
              {t('viewDetails', language)} <span className="text-lg">→</span>
            </button>
          </div>
        </div>
        <div className="p-6">
          <StockProgress stock={stock} />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-700 to-blue-500 px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-bold text-white">{t('recentTransactions', language)}</h3>
            </div>
            <button 
              onClick={() => onNavigate?.('transactions')}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-sm font-medium transition flex items-center gap-1"
            >
              {t('viewAll', language)} <span className="text-lg">→</span>
            </button>
          </div>
        </div>
        
        <div className="p-4">
          {recentTransactions?.length === 0 ? (
            <div className="text-center py-12">
              <IconTransaction className="w-16 h-16 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-lg">{t('noTransactions', language)}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentTransactions?.map((transaction, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition">
                  <div className="flex-1">
                    <p className="text-lg font-semibold text-gray-800">{transaction.customer_name}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {transaction.formatted_date || formatDate(transaction.created_at)}
                    </p>
                  </div>
                  <div className="text-right">
                    {transaction.filled_cylinder !== 'कोही छैन' ? (
                      <div className="flex items-center gap-2 justify-end">
                        <IconFilledCylinder className="w-5 h-5 text-green-600" />
                        <span className="text-base font-semibold text-green-700">
                          {translateCylinder(transaction.filled_cylinder, language)}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 justify-end">
                        <IconReturn className="w-5 h-5 text-blue-600" />
                        <span className="text-base font-semibold text-blue-600">{t('return', language)}</span>
                      </div>
                    )}
                    
                    {transaction.empty_cylinder !== 'कोही छैन' ? (
                      <div className="flex items-center gap-2 justify-end mt-1">
                        <IconEmptyCylinder className="w-5 h-5 text-red-500" />
                        <span className="text-sm text-red-600 font-medium">
                          {translateCylinder(transaction.empty_cylinder, language)}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 justify-end mt-1">
                        <IconNewPurchase className="w-5 h-5 text-orange-500" />
                        <span className="text-sm text-orange-600 font-medium">{t('newPurchase', language)}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}