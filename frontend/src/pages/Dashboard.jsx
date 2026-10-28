import { useState, useEffect, useCallback, useRef } from 'react';
import { StockProgress } from '../components/dashboard/StockProgress';
import { StatsCard } from '../components/dashboard/StatsCard';
import { formatRupees } from '../utils/paymentUtils';
import { PageHeader } from '../components/layout/PageHeader';
import {
  IconDashboardHome,
  IconUsers,
  IconTrendingUp,
  IconTransaction,
  IconQueue,
  IconFilledCylinder,
  IconDashboard,
  IconRefresh,
  IconAlertCircle
} from '../components/icons';
import { useLanguage } from '../context/LanguageContext';
import { t } from '../utils/translations';
import { translateCylinder } from '../utils/cylinderTranslator';
import { getStockStatus } from '../utils/stockStatus';
import { Table } from '../components/ui/Table';

const API_URL = import.meta.env.VITE_API_URL;

export function Dashboard({ showToast, onNavigate }) {
  const { language } = useLanguage();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  // This month's transactions — feeds the frequent-customer leaderboard and
  // today's figures. Fetched through the existing /transactions/all filters API.
  const [monthData, setMonthData] = useState(null);
  const [monthError, setMonthError] = useState(false);
  const hasFetched = useRef(false);

  // The guard prevents duplicate fetches from the mount effect (StrictMode
  // double-invokes effects). Explicit refresh clicks pass force=true to bypass it.
  const fetchDashboardData = useCallback(async (force = false) => {
    if (!force && hasFetched.current) return;
    hasFetched.current = true;
    setLoading(true);
    setLoadError(false);
    setMonthError(false);
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
      setLoadError(true);
      if (showToast) showToast(t('error', language), 'error');
      setLoading(false);
      return;
    }

    // Secondary fetch (non-fatal): all transactions of the current month,
    // same date params and limit style the Transactions CSV export uses.
    try {
      const now = new Date();
      const pad = (n) => String(n).padStart(2, '0');
      const monthStart = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`;
      const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
      const res = await fetch(
        `${API_URL}/transactions/all?date_from=${monthStart}&date_to=${todayStr}&limit=10000`,
        { credentials: 'include' }
      );
      const json = await res.json();
      if (json.success) {
        setMonthData(json.transactions || []);
      } else {
        setMonthError(true);
      }
    } catch {
      console.error('Error fetching monthly transactions');
      setMonthError(true);
    }
    setLoading(false);
  }, [showToast, language]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const locale = language === 'np' ? 'ne-NP' : 'en-US';
  const formatShortDate = (date) =>
    new Date(date).toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' });
  const formatMonthYear = (date) =>
    new Date(date).toLocaleDateString(locale, { month: 'long', year: 'numeric' });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 font-medium">{t('loading', language)}</p>
        </div>
      </div>
    );
  }

  if (loadError && !dashboardData) {
    return (
      <div className="text-center py-16 pb-24">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <IconAlertCircle className="w-10 h-10 text-red-400" />
        </div>
        <p className="text-gray-700 text-lg font-medium">{t('error', language)}</p>
        <button
          onClick={() => fetchDashboardData(true)}
          className="mt-4 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition flex items-center gap-2 mx-auto"
        >
          <IconRefresh className="w-4 h-4" />
          {t('refresh', language)}
        </button>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="text-center py-16 pb-24">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <IconDashboard className="w-10 h-10 text-gray-400" />
        </div>
        <p className="text-gray-500 text-lg">{t('noData', language)}</p>
        <button
          onClick={() => fetchDashboardData(true)}
          className="mt-4 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition flex items-center gap-2 mx-auto"
        >
          <IconRefresh className="w-4 h-4" />
          {t('refresh', language)}
        </button>
      </div>
    );
  }

  const { stats, stock } = dashboardData;

  const monthRows = monthData || [];
  const now = new Date();
  const todayRows = monthRows.filter(r => new Date(r.created_at).toDateString() === now.toDateString());
  const todayTransactions = todayRows.length;
  // "Sold today" uses the same rule as the backend's monthlySales:
  // a transaction counts as a sale when it has a filled cylinder.
  const todaySold = todayRows.filter(r => r.filled_cylinder !== 'कोही छैन').length;
  const todayLabel = formatShortDate(now);
  const monthLabel = formatMonthYear(now);

  // Frequent-customer leaderboard. One DB row = one transaction
  // (transactionService.createTransaction inserts a single row per transaction),
  // so counting rows counts transactions — not cylinders.
  const byCustomer = new Map();
  monthRows.forEach(r => {
    if (!r.customer_name) return;
    const entry = byCustomer.get(r.customer_name) || { name: r.customer_name, count: 0, last: null };
    entry.count += 1;
    const at = new Date(r.created_at);
    if (!entry.last || at > entry.last) entry.last = at;
    byCustomer.set(r.customer_name, entry);
  });

  const sortedCustomers = [...byCustomer.values()].sort(
    (a, b) =>
      b.count - a.count ||
      (b.last ? b.last.getTime() : 0) - (a.last ? a.last.getTime() : 0) ||
      a.name.localeCompare(b.name)
  );
  // Competition ranking: equal counts share a rank; the next rank skips ahead
  // (rank = 1 + number of customers with a strictly higher count).
  // Derived immutably — no loop variables reassigned during render.
  const rankByCount = new Map();
  sortedCustomers.forEach((entry) => {
    if (!rankByCount.has(entry.count)) {
      rankByCount.set(entry.count, 1 + sortedCustomers.filter(e => e.count > entry.count).length);
    }
  });
  const topCustomers = sortedCustomers.slice(0, 5).map((entry) => ({
    ...entry,
    rank: rankByCount.get(entry.count)
  }));

  // Stock warnings from existing rules: filled = 0 blocks sales
  // (stockService.checkFilledStock); low/critical from STOCK_STATUS thresholds
  // in backend/config/constants.js.
  const severity = ['outOfStock', 'critical', 'low'];
  const stockWarnings = Object.entries(stock || {})
    .map(([type, value]) => ({
      type,
      filled: value?.filled || 0,
      status: getStockStatus(value?.filled)
    }))
    .filter(w => w.status !== 'ok')
    .sort((a, b) => severity.indexOf(a.status) - severity.indexOf(b.status));

  return (
    <div className="space-y-6 pb-24">
      <PageHeader
        title={t('dashboard', language)}
        subtitle={t('welcome', language)}
        icon={IconDashboardHome}
        action={
          <button
            onClick={() => fetchDashboardData(true)}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium transition flex items-center gap-2 disabled:opacity-50"
          >
            <IconRefresh className="w-4 h-4" />
            {t('refresh', language)}
          </button>
        }
      />

      {/* Daily / monthly / all-time statistics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* Phase 6.1: cards are clickable — Outstanding Balance deep-links into
            the Transactions page pre-filtered to due-balance rows. */}
        <StatsCard
          title={t('transactions', language)}
          value={todayTransactions}
          caption={todayLabel}
          icon={IconTransaction}
          onClick={() => onNavigate?.('transactions')}
        />
        <StatsCard
          title={t('soldGas', language)}
          value={todaySold}
          caption={`${todayLabel} · ${t('cylinders', language)}`}
          icon={IconFilledCylinder}
          onClick={() => onNavigate?.('transactions')}
        />
        <StatsCard
          title={t('monthlySales', language)}
          value={stats.monthlySales}
          caption={`${monthLabel} · ${t('cylinders', language)}`}
          icon={IconTrendingUp}
          onClick={() => onNavigate?.('transactions')}
        />
        <StatsCard
          title={t('totalCustomers', language)}
          value={stats.totalCustomers}
          icon={IconUsers}
          onClick={() => onNavigate?.('customers')}
        />
        <StatsCard
          title={t('outstandingBalance', language)}
          value={formatRupees(stats.outstandingBalance ?? 0, language)}
          caption={
            stats.outstandingCount > 0
              ? `${stats.outstandingCount} · ${t('outstandingTransactions', language)}`
              : t('noOutstanding', language)
          }
          icon={IconTransaction}
          onClick={() => onNavigate?.('transactions', { outstanding: true })}
        />
      </div>

      {/* Stock status */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 flex justify-between items-center gap-3">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-gray-900">{t('stockStatus', language)}</h2>
            <p className="text-sm text-gray-500 mt-0.5">{t('currentStockStatus', language)}</p>
          </div>
          <button
            onClick={() => onNavigate?.('stock')}
            className="text-sm font-medium text-blue-600 hover:text-blue-700 whitespace-nowrap transition flex items-center gap-1"
          >
            {t('viewDetails', language)} <span aria-hidden="true">→</span>
          </button>
        </div>
        <div className="p-5">
          <StockProgress stock={stock} />
        </div>
      </div>

      {/* Frequent customers — current-month leaderboard */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 flex flex-wrap justify-between items-center gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <h2 className="text-base font-semibold text-gray-900">{t('customers', language)}</h2>
            <span className="text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full whitespace-nowrap">
              {monthLabel}
            </span>
          </div>
          <button
            onClick={() => onNavigate?.('transactions')}
            className="text-sm font-medium text-blue-600 hover:text-blue-700 whitespace-nowrap transition flex items-center gap-1"
          >
            {t('viewAll', language)} <span aria-hidden="true">→</span>
          </button>
        </div>

        <div className="p-4">
          {monthError ? (
            <div className="text-center py-8">
              <IconAlertCircle className="w-10 h-10 text-red-300 mx-auto mb-2" />
              <p className="text-sm text-gray-600">{t('error', language)}</p>
            </div>
          ) : topCustomers.length === 0 ? (
            <div className="text-center py-8">
              <IconUsers className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">{t('noTransactions', language)}</p>
            </div>
          ) : (
            <Table minWidth="min-w-[480px]">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="w-12 p-3 text-left text-xs font-semibold text-gray-500">#</th>
                  <th className="p-3 text-left text-xs font-semibold text-gray-500">{t('customer', language)}</th>
                  <th className="p-3 text-right text-xs font-semibold text-gray-500">{t('transactions', language)}</th>
                  <th className="p-3 text-right text-xs font-semibold text-gray-500">{t('date', language)}</th>
                </tr>
              </thead>
              <tbody>
                {topCustomers.map((c) => (
                  <tr key={c.name} className="border-b border-gray-100 last:border-0">
                    <td className="p-3">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                        c.rank === 1 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {c.rank}
                      </span>
                    </td>
                    <td className="p-3 font-medium text-gray-900 truncate">{c.name}</td>
                    <td className="p-3 text-right font-semibold text-gray-700">{c.count}</td>
                    <td className="p-3 text-right text-sm text-gray-500 whitespace-nowrap">
                      {c.last ? formatShortDate(c.last) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </div>
      </div>

      {/* Store status — only when there is something to act on */}
      {(stockWarnings.length > 0 || stats.activeQueue > 0) && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 flex justify-between items-center gap-3">
            <h2 className="text-base font-semibold text-gray-900">{t('status', language)}</h2>
            {stockWarnings.length > 0 && (
              <button
                onClick={() => onNavigate?.('stock')}
                className="text-sm font-medium text-blue-600 hover:text-blue-700 whitespace-nowrap transition flex items-center gap-1"
              >
                {t('viewDetails', language)} <span aria-hidden="true">→</span>
              </button>
            )}
          </div>

          <div>
            {stockWarnings.map((w) => (
              <div key={w.type} className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-900">{translateCylinder(w.type, language)}</span>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500">{w.filled}</span>
                  {w.status === 'outOfStock' ? (
                    <span className="inline-flex px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                      {t('outOfStock', language)}
                    </span>
                  ) : w.status === 'critical' ? (
                    <span className="inline-flex px-2 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-600 border border-red-200">
                      {t('lowStock', language)}
                    </span>
                  ) : (
                    <span className="inline-flex px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                      {t('lowStock', language)}
                    </span>
                  )}
                </div>
              </div>
            ))}
            {stats.activeQueue > 0 && (
              <div className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-2">
                  <IconQueue className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-gray-900">{t('activeQueue', language)}</span>
                  <span className="text-sm font-bold text-gray-900">{stats.activeQueue}</span>
                </div>
                <button
                  onClick={() => onNavigate?.('queue')}
                  className="text-sm font-medium text-blue-600 hover:text-blue-700 transition"
                >
                  {t('viewQueue', language)}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
