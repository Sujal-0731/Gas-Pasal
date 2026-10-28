import { useState, useEffect, useCallback } from 'react';
import {
  IconRefresh,
  IconPackage,
  IconAlertCircle,
  IconLokpriya,
  IconSugam,
  IconEverest,
  IconOther
} from '../components/icons';
import { useLanguage } from '../context/LanguageContext';
import { t } from '../utils/translations';
import { getStockStatus } from '../utils/stockStatus';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/ui/Button';
import { Table } from '../components/ui/Table';

const API_URL = import.meta.env.VITE_API_URL;

// Same brand keys the stock API and StockProgress use.
const BRANDS = [
  { key: 'लोकप्रिय', labelKey: 'lokpriya', icon: IconLokpriya },
  { key: 'सुगम', labelKey: 'sugam', icon: IconSugam },
  { key: 'एभरेस्ट', labelKey: 'everest', icon: IconEverest },
  { key: 'अन्य / Other', labelKey: 'other', icon: IconOther }
];

function StockSummary() {
  const { language } = useLanguage();
  const [stock, setStock] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const loadStock = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const res = await fetch(`${API_URL}/stock`, {
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        setStock(data.stock);
      } else {
        setLoadError(true);
      }
    } catch (error) {
      console.error('Error loading stock:', error);
      setLoadError(true);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadStock();
  }, [loadStock]);

  // Rows for brands that exist in the stock response (same filter as StockProgress).
  const rows = (stock ? BRANDS.filter(b => stock[b.key]) : []).map(b => {
    const filled = stock[b.key]?.filled || 0;
    const empty = stock[b.key]?.empty || 0;
    return { ...b, filled, empty, total: filled + empty };
  });

  const totals = rows.reduce(
    (sum, r) => ({ filled: sum.filled + r.filled, empty: sum.empty + r.empty, total: sum.total + r.total }),
    { filled: 0, empty: 0, total: 0 }
  );

  const statusBadge = (filled) => {
    const status = getStockStatus(filled);
    if (status === 'outOfStock') {
      return <span className="inline-flex px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">{t('outOfStock', language)}</span>;
    }
    if (status === 'critical') {
      return <span className="inline-flex px-2 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-600 border border-red-200">{t('lowStock', language)}</span>;
    }
    if (status === 'low') {
      return <span className="inline-flex px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">{t('lowStock', language)}</span>;
    }
    return <span className="text-sm text-gray-400">—</span>;
  };

  return (
    <div className="space-y-5 pb-24">
      <PageHeader
        title={t('stockManagement', language)}
        subtitle={t('currentStockStatus', language)}
        icon={IconPackage}
        action={
          <Button onClick={loadStock} size="sm" icon={IconRefresh} loading={loading}>
            {t('refresh', language)}
          </Button>
        }
      />

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-500">{t('loadingStock', language)}</p>
          </div>
        </div>
      ) : loadError ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <IconAlertCircle className="w-12 h-12 text-red-300 mx-auto mb-3" />
          <p className="text-gray-700 font-medium mb-4">{t('error', language)}</p>
          <Button onClick={loadStock} variant="primary" size="sm" icon={IconRefresh}>
            {t('refresh', language)}
          </Button>
        </div>
      ) : rows.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <IconPackage className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">{t('noStockData', language)}</p>
        </div>
      ) : (
        <Table minWidth="min-w-[600px]">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left p-4 text-xs font-semibold text-gray-500">{t('cylinderType', language)}</th>
              <th className="text-right p-4 text-xs font-semibold text-gray-500">{t('filled', language)}</th>
              <th className="text-right p-4 text-xs font-semibold text-gray-500">{t('empty', language)}</th>
              <th className="text-right p-4 text-xs font-semibold text-gray-500">{t('total', language)}</th>
              <th className="text-left p-4 text-xs font-semibold text-gray-500">{t('status', language)}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.key} className="border-b border-gray-100 hover:bg-gray-50 transition">
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <row.icon className="w-5 h-5" />
                    <span className="font-medium text-gray-900">{t(row.labelKey, language)}</span>
                  </div>
                </td>
                <td className="p-4 text-right text-green-600 font-semibold">{row.filled}</td>
                <td className="p-4 text-right text-red-500 font-semibold">{row.empty}</td>
                <td className="p-4 text-right font-medium text-gray-700">{row.total}</td>
                <td className="p-4">{statusBadge(row.filled)}</td>
              </tr>
            ))}
            <tr className="bg-gray-50">
              <td className="p-4 font-semibold text-gray-700">{t('total', language)}</td>
              <td className="p-4 text-right font-semibold text-green-700">{totals.filled}</td>
              <td className="p-4 text-right font-semibold text-red-600">{totals.empty}</td>
              <td className="p-4 text-right font-semibold text-gray-900">{totals.total}</td>
              <td className="p-4" />
            </tr>
          </tbody>
        </Table>
      )}
    </div>
  );
}

export default StockSummary;
