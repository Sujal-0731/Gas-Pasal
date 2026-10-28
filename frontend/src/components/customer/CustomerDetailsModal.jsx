import { useState, useEffect, useRef, useCallback } from 'react';
import {
  IconX,
  IconPhone,
  IconCopy,
  IconAlertCircle,
  IconRefresh
} from '../icons';
import { useLanguage } from '../../context/LanguageContext';
import { t } from '../../utils/translations';
import { Button } from '../ui/Button';
import { TransactionList } from '../transactions/TransactionList';
import { TransactionDetailsModal } from '../transactions/TransactionDetailsModal';
import { RecordPaymentModal } from '../transactions/RecordPaymentModal';

const API_URL = import.meta.env.VITE_API_URL;

// Reusable customer-details modal.
//
// - Fetches GET /customers/:name/history once per open; guarded against
//   StrictMode double-effects and parent re-renders (started + inFlight refs),
//   so no duplicate requests and no refetch loop when a failing endpoint
//   triggers a toast re-render.
// - Pass `historyData` when the caller already has the response to skip the
//   fetch entirely (for pages that already loaded the same data).
// - Close: X button, footer button, backdrop click, and Escape key.
// - Optional `onOpenFullHistory` adds a footer button that hands the loaded
//   response to the caller (Customer History uses it to jump to its full
//   history screen without refetching). Without the prop, the footer is just
//   the Close button, exactly as on the Queue page.
export function CustomerDetailsModal({ customer, onClose, historyData, showToast, onOpenFullHistory }) {
  const { language } = useLanguage();
  const [fetchedData, setFetchedData] = useState(null);
  const [loading, setLoading] = useState(() => !historyData);

  const [error, setError] = useState(false);
  // Phase 6.1: full transaction details + record-payment overlays opened from
  // the shared compact rows. Installments are fetched by the details modal
  // itself (once per open), replacing this modal's old inline toggle.
  const [detailsTx, setDetailsTx] = useState(null);
  const [payingTransaction, setPayingTransaction] = useState(null);
  // Marks that the one allowed fetch for this customer already started
  // (success or failure), so effect re-runs from parent re-renders never
  // duplicate the request or loop on a failing endpoint.
  const startedRef = useRef(null);
  const inFlightRef = useRef(false);
  const panelRef = useRef(null);
  const onCloseRef = useRef(onClose);

  // Keep the latest onClose without re-arming the Escape listener every render.
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  // All state updates in here happen only after the first `await`, so the
  // effect that calls this never sets state synchronously (loading and error
  // are seeded in useState / set by the retry click handler instead).
  const loadHistory = useCallback(async (force = false) => {
    if (!customer?.name || inFlightRef.current) return;
    if (!force && (historyData || startedRef.current === customer.name)) return;
    startedRef.current = customer.name;
    inFlightRef.current = true;
    try {
      const res = await fetch(`${API_URL}/customers/${encodeURIComponent(customer.name)}/history`, {
        credentials: 'include'
      });
      const json = await res.json();
      if (json.success) {
        setFetchedData(json);
        setError(false);
      } else {
        setError(true);
        if (showToast) showToast(json.message || t('error', language), 'error');
      }
    } catch {
      setError(true);
      if (showToast) showToast(t('networkError', language), 'error');
    } finally {
      inFlightRef.current = false;
      setLoading(false);
    }
  }, [customer, historyData, showToast, language]);

  // The latest loader lives in a ref. The mount effect invokes it only
  // indirectly: react-hooks/set-state-in-effect flags an effect that directly
  // references a setState-bearing function even when every state update inside
  // it happens only after a network await (never synchronously). Effect order
  // matters — the sync effect below runs first, then the fetch effect calls
  // whatever is currently in the ref.
  const loadHistoryRef = useRef(null);

  useEffect(() => {
    loadHistoryRef.current = loadHistory;
  }, [loadHistory]);

  useEffect(() => {
    loadHistoryRef.current?.();
  }, [customer, historyData]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onCloseRef.current?.();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    panelRef.current?.focus();
  }, []);

  const makePhoneCall = (phone) => {
    window.open(`tel:${phone}`, '_blank');
  };

  const copyPhoneNumber = async (phone) => {
    try {
      await navigator.clipboard.writeText(phone);
      if (showToast) showToast(`${phone} ${t('copied', language)}`, 'success');
    } catch {
      if (showToast) showToast(t('copyFailed', language), 'error');
    }
  };

  if (!customer) return null;

  // A historyData prop passed by the caller always wins — derived at render,
  // so it needs no fetch and no state update when it changes.
  const data = historyData || fetchedData;
  const info = data?.customer || customer;
  const transactions = (data?.transactions || []).map(tx => ({
    ...tx,
    customer_name: tx.customer_name || info.name
  }));

  // Refresh this customer's history after a payment is recorded so balance/
  // status update, and keep the open details modal in sync with the fresh row
  // (its installment list refetches because total_paid changed).
  const refreshAfterPayment = async () => {
    if (!customer?.name) return;
    try {
      const res = await fetch(`${API_URL}/customers/${encodeURIComponent(customer.name)}/history`, {
        credentials: 'include'
      });
      const json = await res.json();
      if (json.success) {
        setFetchedData(json);
        if (detailsTx) {
          const updated = (json.transactions || []).find(tx => tx.id === detailsTx.id);
          if (updated) setDetailsTx({ ...updated, customer_name: updated.customer_name || customer.name });
        }
      } else if (showToast) {
        showToast(json.message || t('error', language), 'error');
      }
    } catch {
      if (showToast) showToast(t('networkError', language), 'error');
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

  return (
    <>
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 sm:p-6 animate-fade-in"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={t('customerDetails', language)}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl outline-none"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-200 shrink-0">
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-gray-900">{t('customerDetails', language)}</h3>
          </div>
          <button
            onClick={onClose}
            aria-label={t('close', language)}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors shrink-0"
          >
            <IconX className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="text-center">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm text-gray-500">{t('loading', language)}</p>
              </div>
            </div>
          ) : error || !data ? (
            <div className="text-center py-10">
              <IconAlertCircle className="w-12 h-12 text-red-300 mx-auto mb-3" />
              <p className="text-gray-700 font-medium mb-4">{t('error', language)}</p>
              <button
                onClick={() => {
                  setLoading(true);
                  setError(false);
                  loadHistory(true);
                }}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors inline-flex items-center gap-2"
              >
                <IconRefresh className="w-4 h-4" />
                {t('refresh', language)}
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Customer info — only fields the API returned */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <p className="font-semibold text-gray-900">{info.name}</p>
                {info.phone && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm text-gray-500 w-20 shrink-0">{t('phone', language)}</span>
                    <span className="text-sm font-medium text-gray-900">{info.phone}</span>
                    <button
                      onClick={() => copyPhoneNumber(info.phone)}
                      title={t('copy', language)}
                      aria-label={t('copy', language)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                      <IconCopy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => makePhoneCall(info.phone)}
                      title={t('call', language)}
                      aria-label={t('call', language)}
                      className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 transition-colors"
                    >
                      <IconPhone className="w-4 h-4" />
                    </button>
                  </div>
                )}
                {info.address && (
                  <div className="flex flex-wrap items-start gap-2">
                    <span className="text-sm text-gray-500 w-20 shrink-0">{t('address', language)}</span>
                    <span className="text-sm text-gray-900">{info.address}</span>
                  </div>
                )}
                {info.remarks && (
                  <div className="flex flex-wrap items-start gap-2">
                    <span className="text-sm text-gray-500 w-20 shrink-0">{t('remarks', language)}</span>
                    <span className="text-sm text-gray-900">{info.remarks}</span>
                  </div>
                )}
              </div>

              {/* Transaction history */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-base font-semibold text-gray-900">{t('transactionHistory', language)}</h4>
                <span className="text-sm text-gray-500">
                  {t('totalTransactions', language)}: {data.totalExchanges || 0}
                </span>
              </div>

              {transactions.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-xl">
                  <IconAlertCircle className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">{t('noTransactions', language)}</p>
                </div>
              ) : (
                <TransactionList
                  transactions={transactions}
                  onOpen={setDetailsTx}
                  renderActions={renderRowActions}
                />
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-200 flex flex-wrap justify-end gap-3 shrink-0">
          {onOpenFullHistory && data && (
            <button
              onClick={() => onOpenFullHistory(data)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors"
            >
              {t('viewCustomerHistory', language)}
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold transition-colors"
          >
            {t('close', language)}
          </button>
        </div>
      </div>
    </div>

    {/* Phase 6.1: transaction details — opened by clicking any row */}
    {detailsTx && (
      <TransactionDetailsModal
        transaction={detailsTx}
        onClose={() => setDetailsTx(null)}
        onRecordPayment={(tx) => setPayingTransaction(tx)}
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
    </>
  );
}

export default CustomerDetailsModal;