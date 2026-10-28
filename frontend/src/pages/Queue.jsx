import { useState, useEffect, useRef } from 'react';
import {
  IconQueue,
  IconPlus,
  IconUsers,
  IconClock,
  IconSearch,
  IconX,
  IconCheck,
  IconEmptyCylinder
} from '../components/icons';
import { useLanguage } from '../context/LanguageContext';
import { t } from '../utils/translations';
import { getCylinderOptions } from '../utils/cylinderTranslator';
import useDebouncedSearch from '../hooks/useDebouncedSearch';
import { searchCustomers } from '../services/customerService';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/ui/Button';
import { CustomerDetailsModal } from '../components/customer/CustomerDetailsModal';

const API_URL = import.meta.env.VITE_API_URL;

function Queue({ showToast, onSelectCustomerFromQueue }) {
  const { language } = useLanguage();
  
  // Get translated cylinder options
  const cylinderOptions = getCylinderOptions(language);
  // Keep the actual values for API calls
  const cylinderValues = {
    lokpriya: 'लोकप्रिय',
    sugam: 'सुगम',
    everest: 'एभरेस्ट',
    other: 'अन्य / Other'
  };
  
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [emptyCylinder, setEmptyCylinder] = useState(cylinderValues.lokpriya);
  const [notes, setNotes] = useState('');
  const [processingId, setProcessingId] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [detailsCustomer, setDetailsCustomer] = useState(null);
  const [pendingRemoval, setPendingRemoval] = useState(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const modalSearchRef = useRef(null);
  const showToastRef = useRef(showToast);
  const removalDialogRef = useRef(null);
  const removalInProgressRef = useRef(false);
  // Use debounced search for customer search
  const {
    searchTerm,
    setSearchTerm,
    results: searchResults,
    isSearching,
    clearSearch
  } = useDebouncedSearch(searchCustomers, { delay: 500, minChars: 2 });

  // Update showToast ref
  useEffect(() => {
    showToastRef.current = showToast;
  }, [showToast]);

  useEffect(() => {
    loadQueue();
  }, []);

  useEffect(() => {
    if (!pendingRemoval) return undefined;

    const handleKeyDown = (event) => {
      if (
        event.key === 'Escape' &&
        !removalInProgressRef.current
      ) {
        setPendingRemoval(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    removalDialogRef.current?.focus();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [pendingRemoval]);

  const loadQueue = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/queue`, {
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        setQueue(data.queue);
      }
    } catch (error) {
      console.error('Error loading queue:', error);
      if (showToastRef.current) showToastRef.current(t('error', language), 'error');
    }
    setLoading(false);
  };

  const addToQueue = async () => {
    if (!selectedCustomer) {
      if (showToastRef.current) showToastRef.current(t('selectCustomerFirst', language), 'error');
      return;
    }

    setIsAdding(true);
    try {
      const res = await fetch(`${API_URL}/queue`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          customerId: selectedCustomer.id,
          customerName: selectedCustomer.name,
          emptyCylinder: emptyCylinder,
          notes
        }),
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        if (showToastRef.current) showToastRef.current(t('addedToQueueSuccess', language), 'success');
        setShowAddModal(false);
        setSelectedCustomer(null);
        setEmptyCylinder(cylinderValues.lokpriya);
        setNotes('');
        setSearchTerm('');
        clearSearch();
        await loadQueue();
      } else {
        if (showToastRef.current) showToastRef.current(data.message, 'error');
      }
    } catch (error) {
      console.error('Add to queue error:', error);
      if (showToastRef.current) showToastRef.current(t('networkError', language), 'error');
    }
    setIsAdding(false);
  };

  const removeFromQueue = (queueId, customerName) => {
    setPendingRemoval({ queueId, customerName });
  };
// Run the existing removal request only after confirmation.
  const confirmRemoveFromQueue = async () => {
    if (!pendingRemoval || removalInProgressRef.current) return;

    removalInProgressRef.current = true;
    setIsRemoving(true);

    const { queueId, customerName } = pendingRemoval;

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/queue/${queueId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      const data = await res.json();

      if (data.success) {
        if (showToastRef.current) {
          showToastRef.current(
            `${customerName} ${t('removedFromQueue', language)}`,
            'success'
          );
        }

        setQueue(prevQueue =>
          prevQueue.filter(q => q.id !== queueId)
        );

        setPendingRemoval(null);
        await loadQueue();
      } else {
        if (showToastRef.current) {
          showToastRef.current(data.message, 'error');
        }
      }
    } catch (error) {
      console.error('Remove from queue error:', error);

      if (showToastRef.current) {
        showToastRef.current(t('networkError', language), 'error');
      }
    } finally {
      setLoading(false);
      setIsRemoving(false);
      removalInProgressRef.current = false;
    }
  };
  const handleSelectFromQueue = (item) => {
    setProcessingId(item.id);
    setQueue(prevQueue => prevQueue.filter(q => q.id !== item.id));
    onSelectCustomerFromQueue(item);
    if (showToastRef.current) showToastRef.current(`${item.customer_name} ${t('selected', language)}`, 'success');
    
    setTimeout(() => {
      setProcessingId(null);
      loadQueue();
    }, 500);
  };

  const handleSelectCustomer = (customer) => {
    setSelectedCustomer(customer);
    setSearchTerm('');
    clearSearch();
  };

  const getWaitingTime = (queuedAt) => {
    const queued = new Date(queuedAt);
    const now = new Date();
    const diffMs = now - queued;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) return `${diffMins} ${t('minutesAgo', language)}`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} ${t('hoursAgo', language)}`;
    return `${Math.floor(diffMins / 1440)} ${t('daysAgo', language)}`;
  };

  const openModal = () => {
    setShowAddModal(true);
    setSelectedCustomer(null);
    setSearchTerm('');
    clearSearch();
    setTimeout(() => {
      if (modalSearchRef.current) {
        modalSearchRef.current.focus();
      }
    }, 100);
  };

  // Open the customer-details modal without leaving the Queue page.
  // The queue item itself stays untouched, so closing restores the exact screen state.
  const openDetails = (item) => {
    setDetailsCustomer({ id: item.customer_id, name: item.customer_name });
  };

  // Helper to get display label for a cylinder value
  const getCylinderDisplayLabel = (value) => {
    const option = cylinderOptions.find(opt => opt.value === value);
    return option ? option.label : value;
  };

  return (
    <div className="space-y-5 pb-24">
      <PageHeader
        title={t('queue', language)}
        subtitle={t('queueDesc', language)}
        icon={IconQueue}
        action={
          <Button onClick={openModal} icon={IconPlus} size="sm">
            {t('addNew', language)}
          </Button>
        }
      />

      {/* Waiting list */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-gray-900">{t('waitingList', language)}</h2>
            <p className="text-sm text-gray-500 mt-0.5">{t('customerWaitManagement', language)}</p>
          </div>
          <span className="text-sm font-medium text-gray-700 bg-gray-100 px-3 py-1 rounded-full whitespace-nowrap">
            {t('totalInQueue', language)}: {queue.length}
          </span>
        </div>

        <div className="p-5">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : queue.length === 0 ? (
            <div className="text-center py-12">
              <IconQueue className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-base font-medium text-gray-500">{t('queueEmpty', language)}</p>
              <p className="text-sm text-gray-400 mt-1">{t('noCustomersWaiting', language)}</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {queue.map((item) => (
                <div
                  key={item.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => openDetails(item)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      openDetails(item);
                    }
                  }}
                  className={`rounded-xl border p-4 transition ${
                    processingId === item.id
                      ? 'border-blue-200 bg-blue-50 opacity-60 cursor-default'
                      : 'border-gray-200 hover:border-blue-200 hover:bg-gray-50 cursor-pointer'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <IconUsers className="w-4 h-4 text-gray-400 shrink-0" />
                        <span className="font-semibold text-gray-900 truncate">{item.customer_name}</span>
                      </div>
                      <div className="mt-2 flex items-center gap-1.5 text-sm font-medium text-gray-700">
                        <IconEmptyCylinder className="w-4 h-4 text-red-500 shrink-0" />
                        <span>{t('empty', language)}: {getCylinderDisplayLabel(item.empty_cylinder)}</span>
                      </div>
                      <div className="mt-1 flex items-center gap-1.5 text-sm text-gray-500">
                        <IconClock className="w-4 h-4 shrink-0" />
                        <span>{getWaitingTime(item.queued_at)}</span>
                      </div>
                      {item.notes && (
                        <p className="mt-2 text-sm text-gray-600 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
                          {item.notes}
                        </p>
                      )}
                    </div>
                    <div className="flex sm:flex-col gap-2 sm:ml-4 shrink-0">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectFromQueue(item);
                        }}
                        disabled={processingId === item.id}
                      >
                        {processingId === item.id ? t('processing', language) : t('transaction', language)}
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromQueue(item.id, item.customer_name);
                        }}
                        disabled={processingId === item.id}
                      >
                        {t('remove', language)}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Remove from Queue confirmation dialog */}
      {pendingRemoval && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 animate-fade-in"
          onClick={(event) => {
            if (
              event.target === event.currentTarget &&
              !removalInProgressRef.current
            ) {
              setPendingRemoval(null);
            }
          }}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="remove-queue-title"
            aria-describedby="remove-queue-description"
            className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-5 shadow-xl sm:p-6"
          >
            <h3
              id="remove-queue-title"
              className="text-lg font-semibold text-gray-900"
            >
              {t('remove', language)}
            </h3>

            <p
              id="remove-queue-description"
              className="mt-3 text-sm leading-6 text-gray-600"
            >
              <span className="font-semibold text-gray-900">
                {pendingRemoval.customerName}
              </span>{' '}
              {t('confirmRemove', language)}
            </p>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button
                ref={removalDialogRef}
                variant="secondary"
                disabled={isRemoving}
                onClick={() => setPendingRemoval(null)}
              >
                {t('cancel', language)}
              </Button>

              <Button
                variant="danger"
                disabled={isRemoving}
                loading={isRemoving}
                onClick={confirmRemoveFromQueue}
              >
                {isRemoving
                  ? t('processing', language)
                  : t('remove', language)}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add to Queue Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white px-5 py-4 border-b border-gray-200 flex items-center justify-between z-10 rounded-t-2xl">
              <h3 className="text-lg font-semibold text-gray-900">{t('addToQueue', language)}</h3>
              <button
                onClick={() => setShowAddModal(false)}
                aria-label={t('close', language)}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <IconX className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5">
              <div className="mb-5">
                <label htmlFor="queue-customer-search" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('searchCustomer', language)}
                </label>
                <div className="relative">
                  <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="queue-customer-search"
                    ref={modalSearchRef}
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={t('enterName', language)}
                    className="w-full pl-10 pr-4 py-2.5 text-base border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                    autoFocus
                  />
                </div>
              </div>

              {/* Search Results */}
              {searchTerm.length >= 2 && !selectedCustomer && (
                <div className="mb-5 max-h-60 overflow-y-auto border border-gray-200 rounded-lg divide-y">
                  {isSearching ? (
                    <div className="flex justify-center py-6">
                      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="text-center text-gray-500 py-5 text-sm font-medium">{t('noCustomers', language)}</div>
                  ) : (
                    searchResults.map(customer => (
                      <div
                        key={customer.id}
                        onClick={() => handleSelectCustomer(customer)}
                        className="p-3 cursor-pointer hover:bg-blue-50 transition"
                      >
                        <div className="font-semibold text-gray-900">{customer.name}</div>
                        <div className="text-sm text-gray-600 mt-0.5">{customer.phone || t('noPhone', language)}</div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {selectedCustomer && (
                <div className="mb-5 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-xs font-semibold text-blue-700 uppercase tracking-wide">{t('selectedCustomer', language)}</div>
                  <div className="font-semibold text-gray-900 mt-1">{selectedCustomer.name}</div>
                  <button
                    onClick={() => {
                      setSelectedCustomer(null);
                      setSearchTerm('');
                      clearSearch();
                    }}
                    className="mt-2 text-sm font-medium text-red-600 hover:text-red-700"
                  >
                    {t('change', language)}
                  </button>
                </div>
              )}

              {selectedCustomer && (
                <>
                  <div className="mb-5">
                    <label htmlFor="queue-empty-cylinder" className="block text-sm font-medium text-gray-700 mb-2">
                      {t('emptyCylinder', language)}
                    </label>
                    <div className="relative">
                      <select
                        id="queue-empty-cylinder"
                        value={emptyCylinder}
                        onChange={(e) => setEmptyCylinder(e.target.value)}
                        className="w-full px-3 py-2.5 text-base border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-colors appearance-none bg-white pr-10"
                      >
                        {cylinderOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="mb-5">
                    <label htmlFor="queue-notes" className="block text-sm font-medium text-gray-700 mb-2">
                      {t('notes', language)} <span className="text-xs font-normal text-gray-500">({t('optional', language)})</span>
                    </label>
                    <textarea
                      id="queue-notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows="2"
                      placeholder={t('notesPlaceholder', language)}
                      className="w-full px-3 py-2.5 text-base border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all resize-none"
                    />
                  </div>
                </>
              )}

              <div className="flex gap-3 mt-6">
                <Button
                  onClick={addToQueue}
                  disabled={!selectedCustomer || isAdding}
                  loading={isAdding}
                  icon={IconCheck}
                  size="lg"
                  fullWidth
                >
                  {isAdding ? `${t('adding', language)}...` : t('addCustomer', language)}
                </Button>
                <Button
                  onClick={() => {
                    setShowAddModal(false);
                    setSelectedCustomer(null);
                    setSearchTerm('');
                    clearSearch();
                  }}
                  variant="secondary"
                  size="lg"
                  fullWidth
                >
                  {t('cancel', language)}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Customer details modal — opens over the queue, closing restores this exact screen */}
      {detailsCustomer && (
        <CustomerDetailsModal
          customer={detailsCustomer}
          onClose={() => setDetailsCustomer(null)}
          showToast={showToast}
        />
      )}
    </div>
  );
}

export default Queue;
