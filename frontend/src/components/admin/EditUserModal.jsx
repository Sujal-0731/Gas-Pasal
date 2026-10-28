import { useState, useEffect } from 'react';
import { IconX } from '../../components/icons';
import { useLanguage } from '../../context/LanguageContext';
import { t } from '../../utils/translations';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';

const API_URL = import.meta.env.VITE_API_URL;

function EditUserModal({ user, onClose, onSuccess, showToast }) {
  const { language } = useLanguage();
  const [formData, setFormData] = useState({
    username: user.username,
    role: user.role,
    is_active: user.is_active
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
    
    if (!formData.username.trim()) {
      showToast(t('usernameRequired', language), 'error');
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/admin/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: formData.username,
          role: formData.role,
          is_active: formData.is_active
        }),
        credentials: 'include'
      });
      
      const data = await response.json();
      if (data.success) {
        showToast(t('userUpdated', language), 'success');
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
        aria-label={t('editUser', language)}
        className="bg-white rounded-2xl max-w-md w-full shadow-2xl"
      >
        {/* Header — same white pattern as RecordPaymentModal */}
        <div className="p-5 border-b border-gray-200 flex justify-between items-center gap-3">
          <div className="min-w-0">
            <h3 className="text-xl font-bold text-gray-900">{t('editUser', language)}</h3>
            <p className="text-sm text-gray-500 mt-0.5 truncate">{user.username}</p>
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
            label={t('username', language)}
            type="text"
            id="edit-user-username"
            required
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
          />

          <Select
            label={t('role', language)}
            id="edit-user-role"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            options={[
              { value: 'admin', label: t('admin', language) },
              { value: 'mom', label: t('mom', language) }
            ]}
          />

          <label
            htmlFor="is_active"
            className="flex items-center gap-3 p-3 mb-5 rounded-xl border-2 border-gray-200 bg-gray-50 cursor-pointer hover:border-blue-200 transition"
          >
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-semibold text-gray-700">{t('active', language)}</span>
          </label>

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

export default EditUserModal;
