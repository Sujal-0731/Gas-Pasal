// TransactionSummaryRow — the single compact transaction summary used by
// every list in the app (Transactions, Customer History, Customer Details).
// Collapsed state shows ONLY: customer, empty cylinder, filled cylinder (or
// Return Only), payment status badge; date/time is visually secondary.
// Totals, paid, balance, modes, source and other metadata live in
// TransactionDetailsModal. The whole row is one focusable button; optional
// row-level `actions` render OUTSIDE it so they never trigger the row open.
import { useLanguage } from '../../context/LanguageContext';
import { t } from '../../utils/translations';
import { translateCylinder } from '../../utils/cylinderTranslator';
import { statusChipClasses, statusLabelKey } from '../../utils/paymentUtils';
import { IconEmptyCylinder, IconFilledCylinder } from '../icons';

const NONE = 'कोही छैन';

function PaymentStatusBadge({ transaction }) {
  const { language } = useLanguage();
  const tracked = transaction.total_amount !== null && transaction.total_amount !== undefined;

  if (!tracked) {
    // Legacy row: payment state is unknown — say so instead of showing zeros.
    return (
      <span className="shrink-0 px-2 py-0.5 text-[11px] font-semibold rounded-full border bg-gray-100 text-gray-500 border-gray-200">
        {t('statusUnavailable', language)}
      </span>
    );
  }

  const status = transaction.payment_status;
  return (
    <span
      className={`shrink-0 px-2 py-0.5 text-[11px] font-semibold rounded-full border ${statusChipClasses(status)}`}
    >
      {t(statusLabelKey(status), language)}
    </span>
  );
}

export function TransactionSummaryRow({ transaction, onOpen, actions }) {
  const { language } = useLanguage();

  const dateLabel = transaction.date
    || (transaction.created_at ? new Date(transaction.created_at).toLocaleDateString(language === 'np' ? 'ne-NP' : 'en-US') : '');
  const timeLabel = transaction.time || '';

  return (
    <li className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md focus-within:ring-2 focus-within:ring-blue-400 transition-shadow">
      <div className="flex items-stretch">
        <button
          type="button"
          onClick={() => onOpen?.(transaction)}
          aria-label={`${transaction.customer_name || ''} — ${t('transactionDetails', language)}`}
          className="flex-1 min-w-0 text-left px-4 py-3 rounded-l-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="font-semibold text-gray-900 truncate">
              {transaction.customer_name || '—'}
            </p>
            <PaymentStatusBadge transaction={transaction} />
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            {transaction.empty_cylinder === NONE ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 border border-green-100 rounded-full text-xs font-medium">
                {t('newPurchase', language)}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-red-600 font-medium">
                <IconEmptyCylinder className="w-4 h-4 shrink-0" />
                {translateCylinder(transaction.empty_cylinder, language)}
              </span>
            )}

            <span className="text-gray-300" aria-hidden="true">→</span>

            {transaction.filled_cylinder === NONE ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-full text-xs font-medium">
                {t('returnOnly', language)}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-green-700 font-semibold">
                <IconFilledCylinder className="w-4 h-4 shrink-0" />
                {translateCylinder(transaction.filled_cylinder, language)}
              </span>
            )}

            <span className="text-xs text-gray-400 ml-auto whitespace-nowrap">
              {dateLabel}{timeLabel ? ` · ${timeLabel}` : ''}
            </span>
          </div>
        </button>

        {actions && (
          <div className="flex items-center gap-2 pr-3 pl-1 shrink-0">
            {actions}
          </div>
        )}
      </div>
    </li>
  );
}

export default TransactionSummaryRow;