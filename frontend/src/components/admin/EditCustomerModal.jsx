import React, { useState } from 'react';
import { IconX, IconCheck } from '../../components/icons';
import { getAuthHeader } from '../../utils/api';
import { useLanguage } from '../../context/LanguageContext';
import { t } from '../../utils/translations';

const API_URL = import.meta.env.VITE_API_URL;

function EditCustomerModal({ customer, onClose, onSuccess, showToast }) {
  const { language } = useLanguage();
  const [formData, setFormData] = useState({
    name: customer.name,
    phone: customer.phone || '',
    address: customer.address || '',
    remarks: customer.remarks || ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      showToast(t('nameRequired', language), 'error');
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/admin/customers/${customer.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone || null,
          address: formData.address || null,
          remarks: formData.remarks || null
        })
      });
      
      const data = await response.json();
      if (data.success) {
        showToast(t('customerUpdated', language), 'success');
        onSuccess(data.customer);
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
        <div className="bg-gradient-to-r from-green-700 to-green-500 p-5 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-white">{t('editCustomer', language)}</h3>
            <button onClick={onClose} className="text-white hover:bg-white/20 p-1 rounded">
              <IconX className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('name', language)} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-3 border-2 border-gray-300 rounded-xl focus:border-green-500 outline-none transition"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('phone', language)}
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full p-3 border-2 border-gray-300 rounded-xl focus:border-green-500 outline-none"
              placeholder="98xxxxxxxx"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('address', language)}
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full p-3 border-2 border-gray-300 rounded-xl focus:border-green-500 outline-none"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('remarks', language)}
            </label>
            <textarea
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              rows="2"
              className="w-full p-3 border-2 border-gray-300 rounded-xl focus:border-green-500 outline-none resize-none"
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
              className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? t('saving', language) : <><IconCheck className="w-4 h-4" /> {t('save', language)}</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditCustomerModal;