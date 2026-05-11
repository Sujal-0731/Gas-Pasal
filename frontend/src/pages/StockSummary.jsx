import React, { useState, useEffect } from 'react';
import { 
  IconRefresh, 
  IconPackage
} from '../components/icons';
import { StockProgress } from '../components/dashboard/StockProgress';
import { useLanguage } from '../context/LanguageContext';
import { t } from '../utils/translations';

const API_URL = import.meta.env.VITE_API_URL;

function StockSummary() {
  const { language } = useLanguage();
  const [stock, setStock] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadStock = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/stock`, {
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        setStock(data.stock);
      }
    } catch (error) {
      console.error('Error loading stock:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadStock();
  }, []);

  if (loading && !stock) {
    return (
      <div className="flex justify-center py-16">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500">{t('loadingStock', language)}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-24">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-500 rounded-2xl p-6 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <IconPackage className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">{t('stockManagement', language)}</h1>
            <p className="text-blue-100 text-base mt-1">{t('currentStockStatus', language)}</p>
          </div>
        </div>
      </div>

      {/* Stock Progress - Same as Dashboard */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
        <div className="p-6">
          <StockProgress stock={stock} />
        </div>
      </div>

      {/* Refresh Button */}
      <button
        onClick={loadStock}
        disabled={loading}
        className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <div className="w-5 h-5 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
            {t('loading', language)}...
          </>
        ) : (
          <>
            <IconRefresh className="w-5 h-5" />
            {t('refresh', language)}
          </>
        )}
      </button>
    </div>
  );
}

export default StockSummary;