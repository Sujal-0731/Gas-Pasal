import { IconX, IconTrash } from '../icons';
import { t } from '../../utils/translations';

function DeleteConfirmModal({ isOpen, title, message, onConfirm, onCancel, language }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
        <div className="bg-gradient-to-r from-red-600 to-red-500 p-5 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-white">{title || t('confirmDelete', language)}</h3>
            <button onClick={onCancel} className="text-white hover:bg-white/20 p-1 rounded">
              <IconX className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="p-6">
          <p className="text-gray-700 text-lg mb-6">{message}</p>
          
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold transition"
            >
              {t('cancel', language)}
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-semibold transition flex items-center justify-center gap-2"
            >
              <IconTrash className="w-4 h-4" />
              {t('delete', language)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DeleteConfirmModal;