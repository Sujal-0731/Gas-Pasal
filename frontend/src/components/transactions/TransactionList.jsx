// TransactionList — shared list wrapper so every screen renders transactions
// with identical spacing and structure. Pages own their loading/empty/error
// states; this renders only the items.
import { TransactionSummaryRow } from './TransactionSummaryRow';

export function TransactionList({ transactions, onOpen, renderActions, className = '' }) {
  if (!transactions || transactions.length === 0) return null;

  return (
    <ul className={`space-y-2 ${className}`}>
      {transactions.map((transaction, idx) => (
        <TransactionSummaryRow
          key={transaction.id || idx}
          transaction={transaction}
          onOpen={onOpen}
          actions={renderActions?.(transaction)}
        />
      ))}
    </ul>
  );
}

export default TransactionList;