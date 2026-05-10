import React, { useState } from 'react';
import { IconX, IconCheck } from '../../components/icons';
import { getAuthHeader } from '../../utils/api';
import { useLanguage } from '../../context/LanguageContext';
import { t } from '../../utils/translations';

const API_URL = import.meta.env.VITE_API_URL;

function EditStockModal({ stockItem, cylinderType, onClose, onSuccess, showToast }) {
  const { language } = useLanguage();
  const [formData, setFormData] = useState({
    filled_count: stockItem.filled,
    empty_count: stockItem.empty
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/admin/stock/${encodeURIComponent(cylinderType)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({
          filled_count: parseInt(formData.filled_count),
          empty_count: parseInt(formData.empty_count)
        })
      });
      
      const data = await response.json();
      if (data.success) {
        showToast(t('stockUpdated', language), 'success');
        onSuccess();
        onClose();
      } else {
        showToast(data.message, 'error');
      }
    } catch (error) {
      showToast(t('networkError', language), 'error');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
        <div className="bg-gradient-to-r from-orange-700 to-orange-500 p-5 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-white">{cylinderType} - {t('editStock', language)}</h3>
            <button onClick={onClose} className="text-white hover:bg-white/20 p-1 rounded">
              <IconX className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('filled', language)}
            </label>
            <input
              type="number"
              value={formData.filled_count}
              onChange={(e) => setFormData({ ...formData, filled_count: e.target.value })}
              className="w-full p-3 border-2 border-gray-300 rounded-xl focus:border-orange-500 outline-none"
              min="0"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('empty', language)}
            </label>
            <input
              type="number"
              value={formData.empty_count}
              onChange={(e) => setFormData({ ...formData, empty_count: e.target.value })}
              className="w-full p-3 border-2 border-gray-300 rounded-xl focus:border-orange-500 outline-none"
              min="0"
              required
            />
          </div>
          
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-100 hover:bg-gray-200 py-3 rounded-xl font-semibold transition"
            >
              {t('cancel', language)}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-xl font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? t('saving', language) : <><IconCheck className="w-4 h-4" /> {t('save', language)}</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditStockModal;