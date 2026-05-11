import { useState } from 'react';
import { IconX, IconCheck } from '../../components/icons';
import { useLanguage } from '../../context/LanguageContext';
import { t } from '../../utils/translations';

const API_URL = import.meta.env.VITE_API_URL;

function EditUserModal({ user, onClose, onSuccess, showToast }) {
  const { language } = useLanguage();
  const [formData, setFormData] = useState({
    username: user.username,
    role: user.role,
    is_active: user.is_active
  });
  const [loading, setLoading] = useState(false);

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
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
        <div className="bg-gradient-to-r from-blue-700 to-blue-500 p-5 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-white">{t('editUser', language)}</h3>
            <button onClick={onClose} className="text-white hover:bg-white/20 p-1 rounded">
              <IconX className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('username', language)} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full p-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 outline-none transition"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('role', language)}
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full p-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 outline-none"
            >
              <option value="admin">{t('admin', language)}</option>
              <option value="mom">{t('mom', language)}</option>
            </select>
          </div>
          
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="is_active" className="text-sm text-gray-700">
              {t('active', language)}
            </label>
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
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? t('saving', language) : <><IconCheck className="w-4 h-4" /> {t('save', language)}</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditUserModal;   