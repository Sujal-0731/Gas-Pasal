// RecordPaymentModal — Phase 6: record a later installment against an
// existing transaction. Shows original details, paid so far, remaining
// balance and a projected balance before confirmation. Posts to
// POST /api/transactions/:id/payments — never creates a sale or stock change.
import { useState } from 'react';
import { IconX } from '../icons';
import { Button } from '../ui/Button';
import { useLanguage } from '../../context/LanguageContext';
import { t } from '../../utils/translations';
import { formatRupees, computeBalanceDue, statusLabelKey, statusChipClasses } from '../../utils/paymentUtils';

const API_URL = import.meta.env.VITE_API_URL;

export function RecordPaymentModal({ transaction, onClose, onRecorded, showToast }) {
  const { language } = useLanguage();
  const [amount, setAmount] = useState('');
  const [mode, setMode] = useState(null);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const total = transaction.total_amount;
  const paid = transaction.total_paid ?? 0;
  const balance = computeBalanceDue(total, paid);

  const amountRaw = amount === '' ? null : Number(amount);
  const amountValid = amountRaw !== null && Number.isInteger(amountRaw);
  const projected = amountValid && amountRaw > 0 && balance !== null
    ? Math.max(balance - amountRaw, 0)
    : null;

  const validate = () => {
    if (amountRaw === null || !Number.isInteger(amountRaw)) return t('invalidAmount', language);
    if (amountRaw < 0) return t('negativeAmount', language);
    if (amountRaw === 0) return t('invalidAmount', language);
    if (amountRaw > balance) return t('paidExceedsTotal', language);
    if (!mode) return t('modeRequired', language);
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return; // duplicate-submit guard

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError('');
    setSubmitting(true);

    try {
      const res = await fetch(`${API_URL}/transactions/${transaction.id}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amountRaw, mode, note: note || null }),
        credentials: 'include'
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || t('error', language));
        if (showToast) showToast(data.message || t('error', language), 'error');
        return;
      }

      if (showToast) showToast(t('paymentRecorded', language), 'success');
      onRecorded?.();
      onClose?.();
    } catch {
      setError(t('networkError', language));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4 animate-fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
        <div className="p-5 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-gray-900">{t('recordPayment', language)}</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              {transaction.customer_name} · {transaction.transaction_id}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="text-gray-400 hover:text-gray-600 p-1 rounded"
            aria-label={t('cancel', language)}
          >
            <IconX className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Original transaction summary */}
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500 font-medium">{t('totalLabel', language)}</span>
              <span className="font-semibold text-gray-900">{formatRupees(total, language)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500 font-medium">{t('paidLabel', language)}</span>
              <span className="font-semibold text-gray-900">{formatRupees(paid, language)}</span>
            </div>
            <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-200">
              <span className="text-gray-600 font-semibold">{t('balanceDue', language)}</span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-900">{formatRupees(balance, language)}</span>
                <span className={`px-2 py-0.5 text-xs font-bold rounded-full border ${statusChipClasses(transaction.payment_status)}`}>
                  {t(statusLabelKey(transaction.payment_status), language)}
                </span>
              </div>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label htmlFor="rp-amount" className="block text-sm font-semibold text-gray-700 mb-1.5">
              {t('paymentAmountLabel', language)} <span className="text-red-500">*</span>
            </label>
            <input
              id="rp-amount"
              type="number"
              min="1"
              step="1"
              inputMode="numeric"
              autoFocus
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setError('');
              }}
              placeholder="0"
              disabled={submitting}
              className="w-full px-3 py-2.5 text-lg font-bold border-2 border-gray-300 rounded-xl focus:border-blue-500 outline-none transition-colors disabled:bg-gray-100"
            />
          </div>

          {/* Mode */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              {t('paymentMode', language)} <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              {['cash', 'online'].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setMode(mode === m ? null : m);
                    setError('');
                  }}
                  disabled={submitting}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition disabled:opacity-60 ${
                    mode === m
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-white border-gray-300 text-gray-600 hover:border-blue-400'
                  }`}
                >
                  {t(m, language)}
                </button>
              ))}
            </div>
          </div>

          {/* Optional note */}
          <div>
            <label htmlFor="rp-note" className="block text-sm font-semibold text-gray-700 mb-1.5">
              {t('noteOptional', language)}
            </label>
            <input
              id="rp-note"
              type="text"
              maxLength={200}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              disabled={submitting}
              className="w-full px-3 py-2.5 text-base border-2 border-gray-300 rounded-xl focus:border-blue-500 outline-none transition-colors disabled:bg-gray-100"
            />
          </div>

          {/* Projected remaining balance */}
          <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border border-blue-100">
            <span className="text-sm font-semibold text-blue-800">{t('remainingAfter', language)}</span>
            <span className="text-lg font-bold text-blue-900">
              {projected !== null ? formatRupees(projected, language) : formatRupees(balance, language)}
            </span>
          </div>

          {error && (
            <p className="text-red-500 text-sm flex items-center gap-1">
              <span>⚠️</span> {error}
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <Button
              type="button"
              variant="secondary"
              fullWidth
              disabled={submitting}
              onClick={onClose}
            >
              {t('cancel', language)}
            </Button>
            <Button type="submit" variant="primary" fullWidth loading={submitting}>
              {t('recordPayment', language)}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RecordPaymentModal;
