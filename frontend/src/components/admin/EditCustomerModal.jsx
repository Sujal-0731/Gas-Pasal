import { useState, useEffect } from 'react';
import { IconX } from '../../components/icons';
import { useLanguage } from '../../context/LanguageContext';
import { t } from '../../utils/translations';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

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
    
    if (!formData.name.trim()) {
      showToast(t('nameRequired', language), 'error');
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/admin/customers/${customer.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone || null,
          address: formData.address || null,
          remarks: formData.remarks || null
        }),
        credentials: 'include'  // ✅ Send httpOnly cookie
      });
      
      const data = await response.json();
      if (data.success) {
        showToast(t('customerUpdated', language), 'success');
        onSuccess(data.customer);
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
        aria-label={t('editCustomer', language)}
        className="bg-white rounded-2xl max-w-md w-full shadow-2xl"
      >
        {/* Header — same white pattern as RecordPaymentModal */}
        <div className="p-5 border-b border-gray-200 flex justify-between items-center gap-3">
          <div className="min-w-0">
            <h3 className="text-xl font-bold text-gray-900">{t('editCustomer', language)}</h3>
            <p className="text-sm text-gray-500 mt-0.5 truncate">{customer.name}</p>
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
          <Input
            label={t('name', language)}
            type="text"
            id="edit-customer-name"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />

          <Input
            label={t('phone', language)}
            type="tel"
            id="edit-customer-phone"
            placeholder="98xxxxxxxx"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />

          <Input
            label={t('address', language)}
            type="text"
            id="edit-customer-address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />

          {/* textarea keeps the same label/border/focus treatment as Input */}
          <div className="mb-5">
            <label htmlFor="edit-customer-remarks" className="block text-sm font-semibold text-gray-700 mb-2">
              {t('remarks', language)}
            </label>
            <textarea
              id="edit-customer-remarks"
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              rows="2"
              className="w-full px-4 py-3 text-base border-2 border-gray-300 bg-white rounded-xl outline-none transition-all font-medium focus:border-blue-500 focus:ring-4 focus:ring-blue-100 resize-none"
            />
          </div>

          <div className="flex gap-3">
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

export default EditCustomerModal;