// DeleteCustomerModal — Phase 6.1 confirmation dialog for deleting a customer
// from the Admin Panel. On open it fetches (existing endpoints only, no backend
// changes) the customer's transaction count and queue status, so the admin
// SEES why a deletion is blocked before pressing anything:
//   - has history / waiting in queue → info panel + Close only (no delete button)
//   - clean → confirm question + red Delete button
// The server re-checks on DELETE regardless, so a race between this check and
// the click can never destroy financial records — refusals surface as toasts.
import { useState, useEffect, useRef, useCallback } from 'react';
import { IconX, IconTrash, IconAlertCircle } from '../../components/icons';
import { useLanguage } from '../../context/LanguageContext';
import { t } from '../../utils/translations';
import { Button } from '../ui/Button';

const API_URL = import.meta.env.VITE_API_URL;

function DeleteCustomerModal({ customer, onClose, onDeleted, showToast }) {
  const { language } = useLanguage();
  // Starts in the loading state — the first render already shows the spinner,
  // so the effect below never sets state synchronously.
  const [checking, setChecking] = useState(true);
  const [historyCount, setHistoryCount] = useState(null);
  const [inQueue, setInQueue] = useState(false);
  const [checkFailed, setCheckFailed] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Context loader kept behind refs (same pattern as CustomerDetailsModal)
  // so the mount effect never calls a setState-bearing function directly.
  const startedRef = useRef(false);
  const loadContext = useCallback(async () => {
    if (startedRef.current || !customer?.name) return;
    startedRef.current = true;
    try {
      const [histRes, queueRes] = await Promise.all([
        fetch(`${API_URL}/customers/${encodeURIComponent(customer.name)}/history`, { credentials: 'include' }),
        fetch(`${API_URL}/queue`, { credentials: 'include' })
      ]);
      const hist = await histRes.json();
      const queue = await queueRes.json();
      if (hist.success) setHistoryCount(hist.totalExchanges || 0);
      if (queue.success) {
        setInQueue((queue.queue || []).some(q => q.customer_id === customer.id && q.status === 'waiting'));
      }
    } catch {
      setCheckFailed(true);
    } finally {
      setChecking(false);
    }
  }, [customer]);

  const loadRef = useRef(null);
  useEffect(() => { loadRef.current = loadContext; }, [loadContext]);
  useEffect(() => { loadRef.current?.(); }, [loadContext]);

  // Dialog semantics: Escape closes (blocked while a delete is in flight).
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape' && !deleting) onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose, deleting]);

  const hasHistory = (historyCount ?? 0) > 0;
  const blocked = hasHistory || inQueue;

  const handleDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    try {
      const res = await fetch(`${API_URL}/admin/customers/${customer.id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        showToast(t('customerDeleted', language), 'success');
        onDeleted?.();
        onClose();
        return;
      }
      // Server refused (e.g. history appeared after our check) — keep the
      // modal open and show exactly what the backend said.
      showToast(data.message, 'error');
      setDeleting(false);
    } catch {
      showToast(t('networkError', language), 'error');
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t('deleteCustomer', language)}
        className="bg-white rounded-2xl max-w-md w-full shadow-2xl"
      >
        {/* Header — same white pattern as the other admin modals */}
        <div className="p-5 border-b border-gray-200 flex justify-between items-center gap-3">
          <div className="min-w-0">
            <h3 className="text-xl font-bold text-gray-900">{t('deleteCustomer', language)}</h3>
            <p className="text-sm text-gray-500 mt-0.5 truncate">{customer.name}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="text-gray-400 hover:text-gray-600 p-1 rounded shrink-0"
            aria-label={t('close', language) || 'Close'}
          >
            <IconX className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {checking ? (
            <div className="flex items-center justify-center gap-3 py-6 text-gray-500">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">{t('loading', language)}...</span>
            </div>
          ) : blocked ? (
            /* Blocked: explain why, no delete button offered */
            <div className={`rounded-xl border p-4 ${hasHistory ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50'}`}>
              <div className="flex items-start gap-3">
                <IconAlertCircle className={`w-5 h-5 shrink-0 mt-0.5 ${hasHistory ? 'text-red-500' : 'text-amber-500'}`} />
                <div className="text-sm space-y-1.5">
                  {hasHistory && (
                    <p className="font-semibold text-gray-800">
                      {t('totalTransactions', language)}: {historyCount}
                    </p>
                  )}
                  <p className="text-gray-700">
                    {hasHistory ? t('customerHasHistory', language) : t('customerInQueueBlocked', language)}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Clean: confirmation question */}
              <p className="text-gray-700">
                <span className="font-semibold text-gray-900">{customer.name}</span>
                {' — '}{t('confirmDeleteCustomer', language)}
              </p>
              {checkFailed && (
                <p className="text-xs text-gray-400">{t('networkError', language)} — {t('confirmDeleteCustomer', language)}</p>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-200 flex justify-end gap-3">
          {blocked ? (
            <Button type="button" variant="primary" onClick={onClose}>
              {t('close', language) || 'Close'}
            </Button>
          ) : (
            <>
              <Button type="button" variant="secondary" onClick={onClose} disabled={deleting}>
                {t('cancel', language)}
              </Button>
              <Button
                type="button"
                variant="danger"
                onClick={handleDelete}
                loading={deleting}
                icon={IconTrash}
              >
                {t('delete', language)}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default DeleteCustomerModal;