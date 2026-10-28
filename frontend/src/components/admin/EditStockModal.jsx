import { useState, useEffect } from 'react';
import { IconX } from '../../components/icons';
import { useLanguage } from '../../context/LanguageContext';
import { t } from '../../utils/translations';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

const API_URL = import.meta.env.VITE_API_URL;

function EditStockModal({ stockItem, cylinderType, onClose, onSuccess, showToast }) {
  const { language } = useLanguage();
  const [formData, setFormData] = useState({
    filled_count: stockItem.filled,
    empty_count: stockItem.empty
  });
  const [loading, setLoading] = useState(false);

  // Dialog semantics — Escape closes (same pattern as CustomerDetailsModal);
  // the backdrop stays click-inert so a stray click can't discard input.
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape' && !loading) onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose, loading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/admin/stock/${encodeURIComponent(cylinderType)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          filled_count: parseInt(formData.filled_count),
          empty_count: parseInt(formData.empty_count)
        }),
        credentials: 'include'  // ✅ Send httpOnly cookie
      });
      
      const data = await response.json();
      if (data.success) {
        showToast(t('stockUpdated', language), 'success');
        onSuccess();
        onClose();
      } else {
        showToast(data.message, 'error');
      }
    } catch {
      showToast(t('networkError', language), 'error');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${cylinderType} - ${t('editStock', language)}`}
        className="bg-white rounded-2xl max-w-md w-full shadow-2xl"
      >
        {/* Header — same white pattern as RecordPaymentModal */}
        <div className="p-5 border-b border-gray-200 flex justify-between items-center gap-3">
          <div className="min-w-0">
            <h3 className="text-xl font-bold text-gray-900 truncate">{cylinderType}</h3>
            <p className="text-sm text-gray-500 mt-0.5">{t('editStock', language)}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 p-1 rounded shrink-0"
            aria-label={t('cancel', language)}
          >
            <IconX className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-5 space-y-1">
          {/* Related counts side by side — easier to scan than stacked */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t('filled', language)}
              type="number"
              id="edit-stock-filled"
              min="0"
              step="1"
              required
              value={formData.filled_count}
              onChange={(e) => setFormData({ ...formData, filled_count: parseInt(e.target.value) || 0 })}
            />
            <Input
              label={t('empty', language)}
              type="number"
              id="edit-stock-empty"
              min="0"
              step="1"
              required
              value={formData.empty_count}
              onChange={(e) => setFormData({ ...formData, empty_count: parseInt(e.target.value) || 0 })}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" fullWidth onClick={onClose} disabled={loading}>
              {t('cancel', language)}
            </Button>
            <Button type="submit" variant="primary" fullWidth loading={loading}>
              {t('save', language)}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditStockModal;