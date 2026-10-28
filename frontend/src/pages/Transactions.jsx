import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  IconSearch, 
  IconRefresh, 
  IconFilter,
  IconFilledCylinder,
  IconDownload,
  IconChevronLeft,
  IconChevronRight,
  IconList
} from '../components/icons';
import { useLanguage } from '../context/LanguageContext';
import { t } from '../utils/translations';
import { translateCylinder } from '../utils/cylinderTranslator';
import useDebouncedSearch from '../hooks/useDebouncedSearch';
import { searchCustomers } from '../services/customerService';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/ui/Button';
import { CustomerDetailsModal } from '../components/customer/CustomerDetailsModal';
import { RecordPaymentModal } from '../components/transactions/RecordPaymentModal';
import { TransactionList } from '../components/transactions/TransactionList';
import { TransactionDetailsModal } from '../components/transactions/TransactionDetailsModal';

const API_URL = import.meta.env.VITE_API_URL;

// Simple Spinner Component
const Spinner = ({ className = "w-5 h-5" }) => (
  <div className={`${className} border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin`} />
);

function Transactions({ showToast, onNavigate, initialFilters }) {
  const { language } = useLanguage();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  
  // Pagination state (for desktop)
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    itemsPerPage: 20
  });
  
  // Infinite scroll state (for mobile)
  const [mobileTransactions, setMobileTransactions] = useState([]);
  const [mobilePage, setMobilePage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [mobileLoading, setMobileLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Customer details modal (opens over the list, no navigation)
  const [detailsCustomer, setDetailsCustomer] = useState(null);

  // Phase 6: Record Payment modal (later installment)
  const [payingTransaction, setPayingTransaction] = useState(null);

  // Phase 6.1: shared transaction details modal (opened by clicking a row)
  const [detailsTx, setDetailsTx] = useState(null);
  
  // ✅ Use debounced search for customer name
  const {
    searchTerm: debouncedSearchTerm,
    setSearchTerm: setDebouncedSearchTerm,
    isSearching: isSearchingCustomer
  } = useDebouncedSearch(searchCustomers, { 
    delay: 600, 
    minChars: 2,
    clearOnEmpty: false
  });

  // Filter states
  const [selectedCylinder, setSelectedCylinder] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  // Phase 6.1: due-balance filter — also deep-linked from the dashboard's
  // Outstanding Balance card via initialFilters={{ outstanding: true }}.
  const [outstandingOnly, setOutstandingOnly] = useState(initialFilters?.outstanding === true);
  
  // For infinite scroll
  const lastTransactionRef = useRef();
  const isLoadingRef = useRef(false);
  const hasMoreRef = useRef(true);
  const mobilePageRef = useRef(1);

  const cylinderOptions = [
    { value: 'all', label: t('allCylinders', language) },
    { value: 'लोकप्रिय', label: translateCylinder('लोकप्रिय', language) },
    { value: 'सुगम', label: translateCylinder('सुगम', language) },
    { value: 'एभरेस्ट', label: translateCylinder('एभरेस्ट', language) },
    { value: 'अन्य / Other', label: translateCylinder('अन्य', language) }
  ];

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Reset all data when filters change (including debounced search term)
  useEffect(() => {
    // Reset desktop pagination
    setPagination(prev => ({ ...prev, currentPage: 1 }));
    // Reset mobile infinite scroll
    setMobileTransactions([]);
    setMobilePage(1);
    mobilePageRef.current = 1;
    setHasMore(true);
    hasMoreRef.current = true;
    
    // Fetch data based on device
    if (window.innerWidth < 768) {
      fetchMobileTransactions(1, true);
    } else {
      fetchDesktopTransactions(1);
    }
  }, [debouncedSearchTerm, selectedCylinder, dateFrom, dateTo, outstandingOnly]);

  // ========== DESKTOP PAGINATION ==========
  const fetchDesktopTransactions = async (pageNum = 1) => {
    setLoading(true);
    
    try {
      const params = new URLSearchParams({
        page: pageNum,
        limit: pagination.itemsPerPage
      });
      
      if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);
      if (selectedCylinder !== 'all') params.append('cylinder', selectedCylinder);
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);
      if (outstandingOnly) params.append('outstanding', '1');
      
      const response = await fetch(`${API_URL}/transactions/all?${params}`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success) {
        setTransactions(data.transactions);
        setTotalItems(data.pagination.totalItems);
        setPagination({
          currentPage: data.pagination.currentPage,
          totalPages: data.pagination.totalPages,
          itemsPerPage: data.pagination.itemsPerPage
        });
        return data.transactions || [];
      } else {
        showToast(data.message || t('error', language), 'error');
        return [];
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      showToast(t('networkError', language), 'error');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchDesktopTransactions(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // ========== MOBILE INFINITE SCROLL ==========
  const fetchMobileTransactions = async (pageNum, reset = false) => {
    if (isLoadingRef.current) return;
    
    isLoadingRef.current = true;
    setMobileLoading(true);
    
    try {
      const params = new URLSearchParams({
        page: pageNum,
        limit: 20
      });
      
      if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);
      if (selectedCylinder !== 'all') params.append('cylinder', selectedCylinder);
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);
      if (outstandingOnly) params.append('outstanding', '1');
      
      const response = await fetch(`${API_URL}/transactions/all?${params}`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success) {
        if (reset) {
          setMobileTransactions(data.transactions);
        } else {
          setMobileTransactions(prev => [...prev, ...data.transactions]);
        }
        
        setTotalItems(data.pagination.totalItems);
        const hasMoreData = pageNum < data.pagination.totalPages;
        setHasMore(hasMoreData);
        hasMoreRef.current = hasMoreData;
        return data.transactions || [];
      } else {
        showToast(data.message || t('error', language), 'error');
        return [];
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      showToast(t('networkError', language), 'error');
      return [];
    } finally {
      setMobileLoading(false);
      isLoadingRef.current = false;
    }
  };

  const loadMore = useCallback(() => {
    if (isLoadingRef.current || !hasMoreRef.current) return;
    const nextPage = mobilePageRef.current + 1;
    mobilePageRef.current = nextPage;
    setMobilePage(nextPage);
    fetchMobileTransactions(nextPage);
  }, []);

  // Observer for infinite scroll
  useEffect(() => {
    if (!isMobile) return;
    if (!lastTransactionRef.current) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreRef.current && !isLoadingRef.current) {
          loadMore();
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );
    
    observer.observe(lastTransactionRef.current);
    
    return () => observer.disconnect();
  }, [isMobile, mobileTransactions, loadMore]);

  // ========== COMMON FUNCTIONS ==========
  const handleSearch = () => {
    if (isMobile) {
      setMobileTransactions([]);
      setMobilePage(1);
      mobilePageRef.current = 1;
      setHasMore(true);
      hasMoreRef.current = true;
      fetchMobileTransactions(1, true);
    } else {
      fetchDesktopTransactions(1);
    }
  };

  const handleReset = () => {
    setDebouncedSearchTerm('');
    setSelectedCylinder('all');
    setDateFrom('');
    setDateTo('');
    setOutstandingOnly(false);
  };

  // Refresh the current view after a payment is recorded so balance/status update.
  // Also updates the open details modal with the fresh row; its installment
  // list refetches because total_paid changed.
  const refreshAfterPayment = async () => {
    let fresh;
    if (isMobile) {
      setMobileTransactions([]);
      setMobilePage(1);
      mobilePageRef.current = 1;
      setHasMore(true);
      hasMoreRef.current = true;
      fresh = await fetchMobileTransactions(1, true);
    } else {
      fresh = await fetchDesktopTransactions(pagination.currentPage);
    }
    if (detailsTx && Array.isArray(fresh)) {
      const updated = fresh.find(tx => tx.id === detailsTx.id);
      if (updated) setDetailsTx(updated);
    }
  };

  // Row-level action rendered OUTSIDE the row's main click target, so
  // Record Payment can never also open the details view.
  const renderRowActions = (transaction) => {
    const actionable = transaction.payment_status === 'incomplete' || transaction.payment_status === 'partial';
    if (!actionable) return null;
    return (
      <Button
        size="sm"
        variant="outline"
        onClick={() => setPayingTransaction(transaction)}
      >
        {t('recordPayment', language)}
      </Button>
    );
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

  // Open customer details from a transaction row without leaving the page.
  const openCustomerDetails = (transaction) => {
    if (!transaction.customer_name) return;
    setDetailsCustomer({ name: transaction.customer_name });
  };

  const exportToCSV = () => {
    const exportAll = async () => {
      try {
        const params = new URLSearchParams({ limit: 10000 });
        if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);
        if (selectedCylinder !== 'all') params.append('cylinder', selectedCylinder);
        if (dateFrom) params.append('date_from', dateFrom);
        if (dateTo) params.append('date_to', dateTo);
        if (outstandingOnly) params.append('outstanding', '1');
        
        const response = await fetch(`${API_URL}/transactions/all?${params}`, {
          credentials: 'include'
        });
        const data = await response.json();
        
        if (data.success) {
          const headers = ['Date', 'Time', 'Customer', 'Empty Cylinder', 'Filled Cylinder', 'Source', 'Remarks', 'Total (Rs)', 'Paid (Rs)', 'Balance (Rs)', 'Status', 'Payment Modes'];
          const statusText = { incomplete: 'Incomplete', partial: 'Partial', complete: 'Complete' };
          const csvData = data.transactions.map(t => [
            formatDate(t.created_at),
            formatTime(t.created_at),
            t.customer_name,
            t.empty_cylinder === 'कोही छैन' ? 'New Purchase' : translateCylinder(t.empty_cylinder, language),
            t.filled_cylinder === 'कोही छैन' ? 'Return Only' : translateCylinder(t.filled_cylinder, language),
            t.source === 'queue' ? 'Queue' : 'Direct',
            t.remarks || '',
            t.total_amount ?? '',
            t.total_paid ?? '',
            t.balance_due ?? '',
            t.payment_status ? statusText[t.payment_status] : '',
            (t.payment_modes || []).join('+')
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
      <PageHeader
        title={t('allTransactions', language)}
        subtitle={t('transactionsDesc', language)}
        icon={IconList}
        action={
          <Button
            onClick={exportToCSV}
            size="sm"
            icon={IconDownload}
            disabled={(isMobile ? mobileTransactions.length : transactions.length) === 0}
          >
            {t('exportCSV', language)}
          </Button>
        }
      />

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden sticky top-0 z-10">
        <div className="p-5">
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <IconSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={debouncedSearchTerm}
                  onChange={(e) => setDebouncedSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder={t('searchByCustomer', language)}
                  className="w-full pl-11 pr-4 py-2.5 text-base border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                />
              </div>
              {isSearchingCustomer && debouncedSearchTerm.length >= 2 && (
                <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                  <Spinner className="w-3 h-3" />
                  {t('searching', language)}...
                </p>
              )}
            </div>
            
            <Button
              onClick={() => setShowFilters(!showFilters)}
              variant={showFilters ? 'primary' : 'secondary'}
              icon={IconFilter}
            >
              {t('filters', language)}
            </Button>
            
            <Button onClick={handleSearch} variant="primary">
              {t('search', language)}
            </Button>
            
            <Button onClick={handleReset} variant="secondary">
              {t('reset', language)}
            </Button>

            {/* Phase 6.1: due-balance filter — lists only transactions whose
                balance is still owed (legacy rows never qualify). */}
            <Button
              onClick={() => setOutstandingOnly(prev => !prev)}
              variant={outstandingOnly ? 'primary' : 'secondary'}
            >
              {t('outstandingBalance', language)}
            </Button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
              <div>
                <label htmlFor="tx-cylinder" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('cylinderType', language)} ({t('soldGas', language)})
                </label>
                <select
                  id="tx-cylinder"
                  value={selectedCylinder}
                  onChange={(e) => setSelectedCylinder(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                >
                  {cylinderOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="tx-date-from" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('dateFrom', language)}
                </label>
                <input
                  id="tx-date-from"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                />
              </div>
              
              <div>
                <label htmlFor="tx-date-to" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('dateTo', language)}
                </label>
                <input
                  id="tx-date-to"
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results Count */}
      <div className="flex justify-between items-center px-2">
        <p className="text-sm text-gray-500">
          {t('totalTransactions', language)}: {totalItems}
        </p>
        {((isMobile && mobileLoading) || (!isMobile && loading)) && (
          <div className="flex items-center gap-2 text-gray-400">
            <Spinner className="w-4 h-4" />
            <span className="text-sm">{t('loading', language)}...</span>
          </div>
        )}
      </div>

      {/* ========== DESKTOP VIEW (Table + Pagination) ========== */}
      <div className="hidden md:block">
        {transactions.length === 0 && !loading ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <IconFilledCylinder className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-500">
              {outstandingOnly ? t('noOutstandingTx', language) : t('noTransactions', language)}
            </p>
            <div className="mt-4 flex justify-center gap-3">
              {outstandingOnly ? (
                <Button variant="secondary" size="sm" onClick={() => setOutstandingOnly(false)}>
                  {t('reset', language)}
                </Button>
              ) : onNavigate ? (
                <Button variant="secondary" size="sm" onClick={() => onNavigate('customers')}>
                  {t('viewCustomerHistory', language)}
                </Button>
              ) : null}
            </div>
          </div>
        ) : (
          <>
            <TransactionList
              transactions={transactions}
              onOpen={setDetailsTx}
              renderActions={renderRowActions}
            />
            

            {/* Desktop Pagination */}
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
      </div>

      {/* ========== MOBILE VIEW (Cards + Infinite Scroll) ========== */}
      <div className="md:hidden space-y-3">
        {mobileTransactions.length === 0 && !mobileLoading ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <IconFilledCylinder className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-500">
              {outstandingOnly ? t('noOutstandingTx', language) : t('noTransactions', language)}
            </p>
            <div className="mt-4 flex justify-center gap-3">
              {outstandingOnly ? (
                <Button variant="secondary" size="sm" onClick={() => setOutstandingOnly(false)}>
                  {t('reset', language)}
                </Button>
              ) : onNavigate ? (
                <Button variant="secondary" size="sm" onClick={() => onNavigate('customers')}>
                  {t('viewCustomerHistory', language)}
                </Button>
              ) : null}
            </div>
          </div>
        ) : (
          <>
            <TransactionList
              transactions={mobileTransactions}
              onOpen={setDetailsTx}
              renderActions={renderRowActions}
            />
            {/* Infinite-scroll sentinel observed by the IntersectionObserver */}
            <div ref={lastTransactionRef} aria-hidden="true" />

            {/* Mobile Loading Indicator */}
            {mobileLoading && mobileTransactions.length > 0 && (
              <div className="flex justify-center py-4">
                <div className="flex items-center gap-2 text-gray-400">
                  <Spinner className="w-5 h-5" />
                  <span>{t('loadingMore', language)}...</span>
                </div>
              </div>
            )}

            {/* Mobile End of List */}
            {!hasMore && mobileTransactions.length > 0 && (
              <div className="text-center py-4 text-gray-400 text-sm">
                ─ {t('endOfList', language)} ─
              </div>
            )}
          </>
        )}
      </div>

      {/* Refresh Button */}
      <button
        onClick={handleSearch}
        disabled={isMobile ? mobileLoading : loading}
        className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-medium transition flex items-center justify-center gap-2"
      >
        {(isMobile ? mobileLoading : loading) && (isMobile ? mobileTransactions.length === 0 : transactions.length === 0) ? (
          <Spinner className="w-5 h-5" />
        ) : (
          <IconRefresh className="w-5 h-5" />
        )}
        {t('refresh', language)}
      </button>

      {/* Customer details modal — opens over the list, closing restores this exact screen */}
      {detailsCustomer && (
        <CustomerDetailsModal
          customer={detailsCustomer}
          onClose={() => setDetailsCustomer(null)}
          showToast={showToast}
        />
      )}

      {/* Phase 6.1: transaction details — opened by clicking any row */}
      {detailsTx && (
        <TransactionDetailsModal
          transaction={detailsTx}
          onClose={() => setDetailsTx(null)}
          onRecordPayment={(tx) => setPayingTransaction(tx)}
          onViewCustomer={(tx) => {
            // close details first: customer modal opens as the top layer
            setDetailsTx(null);
            openCustomerDetails(tx);
          }}
        />
      )}

      {/* Phase 6: Record Payment modal */}
      {payingTransaction && (
        <RecordPaymentModal
          transaction={payingTransaction}
          onClose={() => setPayingTransaction(null)}
          onRecorded={refreshAfterPayment}
          showToast={showToast}
        />
      )}
    </div>
  );
}

export default Transactions;