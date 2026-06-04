import { IconCheck, IconPlus, IconEye, IconX, IconEmptyCylinder, IconFilledCylinder } from '../icons';
import { translateCylinder } from '../../utils/cylinderTranslator';
import { t } from '../../utils/translations';

function TransactionSuccessModal({ transaction, completedCustomer, onClose, onViewHistory, onNewTransaction, language }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-2xl max-w-sm w-full shadow-xl overflow-hidden">
        {/* Header - Simple success header */}
        <div className="bg-green-50 px-5 py-4 border-b border-green-100">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <IconCheck className="w-4 h-4 text-green-600" />
              </div>
              <h3 className="text-base font-bold text-green-800">{t('transactionComplete', language)}</h3>
            </div>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <IconX className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Body */}
        <div className="p-4">
          {/* Customer Name - Large and prominent */}
          <div className="text-center mb-4">
            <p className="text-xl font-bold text-gray-900">{completedCustomer?.name}</p>
          </div>
          
          {/* Transaction Details - Simple exchange display */}
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <div className="flex items-center justify-center gap-2">
              {/* Empty Cylinder */}
              {transaction?.emptyCylinder && transaction.emptyCylinder !== 'कोही छैन' && (
                <div className="flex-1 text-center">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-1">
                    <IconEmptyCylinder className="w-4 h-4 text-red-600" />
                  </div>
                  <p className="text-xs font-semibold text-red-700">
                    {translateCylinder(transaction.emptyCylinder, language)}
                  </p>
                </div>
              )}
              
              {/* Arrow */}
              {transaction?.emptyCylinder && transaction.emptyCylinder !== 'कोही छैन' && 
               transaction?.filledCylinder && transaction.filledCylinder !== 'कोही छैन' && (
                <div className="text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              )}
              
              {/* Filled Cylinder */}
              {transaction?.filledCylinder && transaction.filledCylinder !== 'कोही छैन' && (
                <div className="flex-1 text-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-1">
                    <IconFilledCylinder className="w-4 h-4 text-blue-600" />
                  </div>
                  <p className="text-xs font-semibold text-blue-700">
                    {translateCylinder(transaction.filledCylinder, language)}
                  </p>
                </div>
              )}
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="space-y-2">
            <button
              onClick={onNewTransaction}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-2"
            >
              <IconPlus className="w-4 h-4" />
              {t('newTransaction', language)}
            </button>
            
            <button
              onClick={onViewHistory}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-2"
            >
              <IconEye className="w-4 h-4" />
              {t('viewCustomerHistory', language)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TransactionSuccessModal;