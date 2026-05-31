import { useState, useEffect, useCallback } from 'react';
import { 
  IconSearch, 
  IconRefresh, 
  IconFilter,
  IconFilledCylinder,
  IconEmptyCylinder,
  IconDownload,
  IconChevronLeft,
  IconChevronRight
} from '../components/icons';
import { useLanguage } from '../context/LanguageContext';
import { t } from '../utils/translations';
import { translateCylinder } from '../utils/cylinderTranslator';

const API_URL = import.meta.env.VITE_API_URL;

// Simple Spinner Component
const Spinner = ({ className = "w-5 h-5" }) => (
  <div className={`${className} border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin`} />
);

function Transactions({ showToast }) {
  const { language } = useLanguage();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20
  });
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCylinder, setSelectedCylinder] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const cylinderOptions = [
    { value: 'all', label: t('allCylinders', language) },
    { value: 'लोकप्रिय', label: translateCylinder('लोकप्रिय', language) },
    { value: 'सुगम', label: translateCylinder('सुगम', language) },
    { value: 'एभरेस्ट', label: translateCylinder('एभरेस्ट', language) },
    { value: 'अन्य / Other', label: translateCylinder('अन्य', language) }
  ];

  // Fetch transactions with pagination
  const fetchTransactions = useCallback(async (pageNum = 1) => {
    setLoading(true);
    
    try {
      const params = new URLSearchParams({
        page: pageNum,
        limit: pagination.itemsPerPage
      });
      
      if (searchTerm) params.append('search', searchTerm);
      if (selectedCylinder !== 'all') params.append('cylinder', selectedCylinder);
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);
      
      const response = await fetch(`${API_URL}/transactions/all?${params}`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success) {
        setTransactions(data.transactions);
        setPagination({
          currentPage: data.pagination.currentPage,
          totalPages: data.pagination.totalPages,
          totalItems: data.pagination.totalItems,
          itemsPerPage: data.pagination.itemsPerPage
        });
      } else {
        showToast(data.message || t('error', language), 'error');
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      showToast(t('networkError', language), 'error');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedCylinder, dateFrom, dateTo, pagination.itemsPerPage, showToast, language]);

  // Initial load when filters change
  useEffect(() => {
    fetchTransactions(1);
  }, [fetchTransactions]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchTransactions(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSearch = () => {
    fetchTransactions(1);
  };

  const handleReset = () => {
    setSearchTerm('');
    setSelectedCylinder('all');
    setDateFrom('');
    setDateTo('');
    fetchTransactions(1);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'np' ? 'ne-NP' : 'en-US');
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString(language === 'np' ? 'ne-NP' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const exportToCSV = () => {
    const exportAll = async () => {
      try {
        const params = new URLSearchParams({
          limit: 10000
        });
        if (searchTerm) params.append('search', searchTerm);
        if (selectedCylinder !== 'all') params.append('cylinder', selectedCylinder);
        if (dateFrom) params.append('date_from', dateFrom);
        if (dateTo) params.append('date_to', dateTo);
        
        const response = await fetch(`${API_URL}/transactions/all?${params}`, {
          credentials: 'include'
        });
        const data = await response.json();
        
        if (data.success) {
          const headers = ['Date', 'Time', 'Customer', 'Empty Cylinder', 'Filled Cylinder', 'Source', 'Remarks'];
          const csvData = data.transactions.map(t => [
            formatDate(t.created_at),
            formatTime(t.created_at),
            t.customer_name,
            t.empty_cylinder === 'कोही छैन' ? 'New Purchase' : translateCylinder(t.empty_cylinder, language),
            t.filled_cylinder === 'कोही छैन' ? 'Return Only' : translateCylinder(t.filled_cylinder, language),
            t.source === 'queue' ? 'Queue' : 'Direct',
            t.remarks || ''
          ]);
          
          const csvContent = [headers, ...csvData].map(row => row.join(',')).join('\n');
          const blob = new Blob([csvContent], { type: 'text/csv' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
          a.click();
          URL.revokeObjectURL(url);
          showToast(t('exportSuccess', language), 'success');
        }
      } catch (error) {
        showToast(t('error', language), 'error');
      }
    };
    
    exportAll();
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const { currentPage, totalPages } = pagination;
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="space-y-5 pb-24">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-500 rounded-2xl p-6 shadow-lg sticky top-0 z-10">
        <div className="flex justify-between items-center flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <IconFilledCylinder className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">{t('allTransactions', language)}</h1>
              <p className="text-blue-100 text-base mt-1">{t('transactionsDesc', language)}</p>
            </div>
          </div>
          <button
            onClick={exportToCSV}
            className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-sm font-medium transition flex items-center gap-2"
            disabled={transactions.length === 0}
          >
            <IconDownload className="w-4 h-4" />
            {t('exportCSV', language)}
          </button>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden sticky top-24 z-10">
        <div className="p-5">
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <IconSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder={t('searchByCustomer', language)}
                  className="w-full pl-11 pr-4 py-3 text-base border-2 border-gray-300 rounded-xl focus:border-blue-500 outline-none transition"
                />
              </div>
            </div>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-3 rounded-xl flex items-center gap-2 transition ${
                showFilters ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              <IconFilter className="w-5 h-5" />
              {t('filters', language)}
            </button>
            
            <button
              onClick={handleSearch}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition"
            >
              {t('search', language)}
            </button>
            
            <button
              onClick={handleReset}
              className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition"
            >
              {t('reset', language)}
            </button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('cylinderType', language)} ({t('soldGas', language)})
                </label>
                <select
                  value={selectedCylinder}
                  onChange={(e) => setSelectedCylinder(e.target.value)}
                  className="w-full p-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 outline-none"
                >
                  {cylinderOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('dateFrom', language)}
                </label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full p-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('dateTo', language)}
                </label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full p-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 outline-none"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results Count */}
      <div className="flex justify-between items-center px-2">
        <p className="text-sm text-gray-500">
          {t('totalTransactions', language)}: {pagination.totalItems}
        </p>
        {loading && (
          <div className="flex items-center gap-2 text-gray-400">
            <Spinner className="w-4 h-4" />
            <span className="text-sm">{t('loading', language)}...</span>
          </div>
        )}
      </div>

      {/* Transactions Table */}
      {transactions.length === 0 && !loading ? (
        <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-8 text-center">
          <IconFilledCylinder className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-500">{t('noTransactions', language)}</p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <div className="min-w-[800px]">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b-2">
                    <tr>
                      <th className="text-left p-4 font-semibold text-gray-700 whitespace-nowrap">{t('date', language)}</th>
                      <th className="text-left p-4 font-semibold text-gray-700 whitespace-nowrap">{t('customer', language)}</th>
                      <th className="text-left p-4 font-semibold text-gray-700 whitespace-nowrap">{t('emptyCylinder', language)}</th>
                      <th className="text-left p-4 font-semibold text-gray-700 whitespace-nowrap">{t('filledCylinder', language)}</th>
                      <th className="text-left p-4 font-semibold text-gray-700 whitespace-nowrap">{t('source', language)}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((transaction, idx) => (
                      <tr key={idx} className="border-b hover:bg-gray-50 transition">
                        <td className="p-4 whitespace-nowrap">
                          <div>{formatDate(transaction.created_at)}</div>
                          <div className="text-xs text-gray-400">{formatTime(transaction.created_at)}</div>
                        </td>
                        <td className="p-4 font-medium text-gray-900 whitespace-nowrap">{transaction.customer_name}</td>
                        <td className="p-4 whitespace-nowrap">
                          {transaction.empty_cylinder === 'कोही छैन' ? (
                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                              {t('newPurchase', language)}
                            </span>
                          ) : (
                            <div className="flex items-center gap-2">
                              <IconEmptyCylinder className="w-4 h-4 text-red-500 flex-shrink-0" />
                              <span>{translateCylinder(transaction.empty_cylinder, language)}</span>
                            </div>
                          )}
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          {transaction.filled_cylinder === 'कोही छैन' ? (
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                              {t('returnOnly', language)}
                            </span>
                          ) : (
                            <div className="flex items-center gap-2">
                              <IconFilledCylinder className="w-4 h-4 text-green-600 flex-shrink-0" />
                              <span className="font-medium">{translateCylinder(transaction.filled_cylinder, language)}</span>
                            </div>
                          )}
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          {transaction.source === 'queue' ? (
                            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                              {t('fromQueue', language)}
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                              {t('direct', language)}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-5 flex-wrap">
              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
                className="p-2 bg-gray-100 rounded-lg disabled:opacity-50 hover:bg-gray-200 transition"
              >
                <IconChevronLeft className="w-5 h-5" />
              </button>
              
              {getPageNumbers().map((page, index) => (
                <button
                  key={index}
                  onClick={() => typeof page === 'number' && handlePageChange(page)}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    page === pagination.currentPage
                      ? 'bg-blue-600 text-white'
                      : page === '...'
                      ? 'bg-transparent cursor-default'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                  disabled={page === '...'}
                >
                  {page}
                </button>
              ))}
              
              <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages}
                className="p-2 bg-gray-100 rounded-lg disabled:opacity-50 hover:bg-gray-200 transition"
              >
                <IconChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </>
      )}

      {/* Refresh Button */}
      <button
        onClick={() => fetchTransactions(pagination.currentPage)}
        disabled={loading}
        className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-medium transition flex items-center justify-center gap-2"
      >
        {loading ? (
          <Spinner className="w-5 h-5" />
        ) : (
          <IconRefresh className="w-5 h-5" />
        )}
        {t('refresh', language)}
      </button>
    </div>
  );
}

export default Transactions;