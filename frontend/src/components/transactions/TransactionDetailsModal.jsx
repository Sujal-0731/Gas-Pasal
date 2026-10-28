// TransactionDetailsModal — full details for one transaction, opened by
// clicking any TransactionSummaryRow. Shows everything the compact row hides:
// customer, date/time, cylinders, source, total/paid/balance/status, the
// payment installment history (amount, date/time, Cash/Online mode) and the
// Record Payment action when an outstanding balance exists.
// Installments are fetched once per open and only refetched when the paid
// total actually changes (i.e. after a payment is recorded) — expanding a
// transaction never issues duplicate payment requests. Legacy transactions
// (total_amount null) explain that tracking is unavailable instead of
// showing misleading zeros.
import { useEffect, useState, useCallback, useRef } from 'react';
import { IconX, IconEmptyCylinder, IconFilledCylinder, IconQueue } from '../icons';
import { Button } from '../ui/Button';
import { useLanguage } from '../../context/LanguageContext';
import { t } from '../../utils/translations';
import { translateCylinder } from '../../utils/cylinderTranslator';
import { formatRupees, statusChipClasses, statusLabelKey } from '../../utils/paymentUtils';

const API_URL = import.meta.env.VITE_API_URL;
const NONE = 'कोही छैन';

export function TransactionDetailsModal({
  transaction,
  onClose,
  onRecordPayment,
  onViewCustomer
}) {
  const { language } = useLanguage();
  const [payments, setPayments] = useState(null);
  const [paymentsError, setPaymentsError] = useState('');

  const tracked = transaction.total_amount !== null && transaction.total_amount !== undefined;

  const loadPayments = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/transactions/${transaction.id}/payments`, {
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        setPayments(data.payments || []);
        setPaymentsError('');
      } else {
        setPaymentsError(data.message || t('error', language));
      }
    } catch {
      setPaymentsError(t('networkError', language));
    }
  }, [transaction.id, language]);

  // The latest loader lives in a ref (same pattern as CustomerDetailsModal):
  // react-hooks/set-state-in-effect flags an effect that directly references a
  // setState-bearing function even when every state update inside it happens
  // only after the network await. The sync effect below arms the ref first,
  // then the fetch effect calls whatever is currently in it.
  const loadPaymentsRef = useRef(null);

  useEffect(() => {
    loadPaymentsRef.current = loadPayments;
  }, [loadPayments]);

  // Fetch on open; refetch only when total_paid changes (payment recorded).
  useEffect(() => {
    loadPaymentsRef.current?.();
  }, [loadPayments, transaction.total_paid]);

  const dateLabel = transaction.date
    || (transaction.created_at ? new Date(transaction.created_at).toLocaleDateString(language === 'np' ? 'ne-NP' : 'en-US') : '');
  const timeLabel = transaction.time || '';
  const actionable = tracked && transaction.balance_due > 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4 animate-fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-gray-200 flex justify-between items-start gap-3 shrink-0">
          <div className="min-w-0">
            <h3 className="text-xl font-bold text-gray-900">{t('transactionDetails', language)}</h3>
            <p className="text-sm text-gray-500 mt-0.5 truncate">
              {transaction.customer_name} · {transaction.transaction_id}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded shrink-0"
            aria-label={t('close', language) || 'Close'}
          >
            <IconX className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Date/time + source */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="text-gray-600 font-medium">
              {dateLabel}{timeLabel ? ` · ${timeLabel}` : ''}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
              transaction.source === 'queue'
                ? 'bg-purple-100 text-purple-700'
                : 'bg-gray-100 text-gray-600'
            }`}>
              {transaction.source === 'queue' ? (
                <span className="flex items-center gap-1"><IconQueue className="w-3 h-3" />{t('fromQueue', language)}</span>
              ) : (
                t('direct', language)
              )}
            </span>
          </div>

          {/* Cylinders */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl border border-red-100 bg-red-50/40">
              <p className="text-xs font-bold text-red-700 mb-1">{t('emptyCylinder', language)}</p>
              {transaction.empty_cylinder === NONE ? (
                <p className="text-sm font-semibold text-green-700">{t('newPurchase', language)}</p>
              ) : (
                <p className="flex items-center gap-1.5 text-sm font-semibold text-gray-800">
                  <IconEmptyCylinder className="w-4 h-4 text-red-500 shrink-0" />
                  {translateCylinder(transaction.empty_cylinder, language)}
                </p>
              )}
            </div>
            <div className="p-3 rounded-xl border border-green-100 bg-green-50/40">
              <p className="text-xs font-bold text-green-700 mb-1">{t('filledCylinder', language)}</p>
              {transaction.filled_cylinder === NONE ? (
                <p className="text-sm font-semibold text-blue-600">{t('returnOnly', language)}</p>
              ) : (
                <p className="flex items-center gap-1.5 text-sm font-semibold text-gray-800">
                  <IconFilledCylinder className="w-4 h-4 text-green-600 shrink-0" />
                  {translateCylinder(transaction.filled_cylinder, language)}
                </p>
              )}
            </div>
          </div>

          {transaction.queue_date && transaction.source === 'queue' && (
            <p className="text-xs text-gray-400">
              {t('queueDate', language)}: {new Date(transaction.queue_date).toLocaleDateString(language === 'np' ? 'ne-NP' : 'en-US')}
            </p>
          )}

          {/* Payment summary */}
          <div className="rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <span className="text-sm font-bold text-gray-700">{t('paymentSection', language)}</span>
              {tracked && (
                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${statusChipClasses(transaction.payment_status)}`}>
                  {t(statusLabelKey(transaction.payment_status), language)}
                </span>
              )}
            </div>

            {tracked ? (
              <div className="p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">{t('totalLabel', language)}</span>
                  <span className="font-semibold text-gray-900">{formatRupees(transaction.total_amount, language)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">{t('paidLabel', language)}</span>
                  <span className="font-semibold text-gray-900">{formatRupees(transaction.total_paid ?? 0, language)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-100">
                  <span className="text-gray-600 font-semibold">{t('balanceDue', language)}</span>
                  <span className={`font-bold ${transaction.balance_due > 0 ? 'text-gray-900' : 'text-green-700'}`}>
                    {formatRupees(transaction.balance_due, language)}
                  </span>
                </div>

                {/* Installment history */}
                <div className="pt-2 border-t border-gray-100">
                  <p className="text-xs font-bold text-gray-500 mb-2">{t('paymentHistory', language)}</p>
                  {paymentsError ? (
                    <p className="text-xs text-red-500">{paymentsError}</p>
                  ) : payments === null ? (
                    <p className="text-xs text-gray-400">{t('loading', language)}...</p>
                  ) : payments.length === 0 ? (
                    <p className="text-xs text-gray-400">{t('noPaymentsYet', language)}</p>
                  ) : (
                    <div className="space-y-1">
                      {payments.map((p, i) => (
                        <div key={p.id || i} className="flex justify-between items-center text-xs bg-gray-50 rounded-lg px-2.5 py-1.5 border border-gray-100">
                          <span className="text-gray-500">
                            {new Date(p.paid_at).toLocaleDateString(language === 'np' ? 'ne-NP' : 'en-US')}
                          </span>
                          <span className="flex items-center gap-2">
                            {p.note && <span className="text-gray-400 max-w-[120px] truncate">{p.note}</span>}
                            <span className="px-1.5 py-0.5 rounded border text-[10px] font-bold bg-gray-100 text-gray-700 border-gray-200">
                              {t(p.payment_mode, language)}
                            </span>
                            <span className="font-bold text-gray-900">{formatRupees(p.amount, language)}</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p className="p-4 text-sm text-gray-500">
                {t('legacyNoTracking',language)} — {t('legacyNoTrackingHint', language)}
              </p>
            )}
          </div>

          {transaction.remarks && (
            <div className="text-sm text-gray-500">
              <span className="font-semibold text-gray-600">{t('remarks', language)}: </span>
              {transaction.remarks}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-200 flex flex-wrap justify-end gap-3 shrink-0">
          {onViewCustomer && (
            <Button variant="outline" size="sm" onClick={() => onViewCustomer(transaction)}>
              {t('customerDetails', language)}
            </Button>
          )}
          <Button variant="secondary" size="sm" onClick={onClose}>
            {t('close', language) || 'Close'}
          </Button>
          {actionable && (
            <Button variant="primary" size="sm" onClick={() => onRecordPayment?.(transaction)}>
              {t('recordPayment', language)}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default TransactionDetailsModal;