import React, { useState } from 'react';
import { IconPlus, IconCheck, IconX, IconNewCustomer } from '../components/icons';
import { useLanguage } from '../context/LanguageContext';
import { t } from '../utils/translations';

const API_URL = import.meta.env.VITE_API_URL;

function NewCustomer({ showToast }) {
  const { language } = useLanguage();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);
  const showToastRef = React.useRef(showToast);

  React.useEffect(() => {
    showToastRef.current = showToast;
  }, [showToast]);

  const registerCustomer = async () => {
    // Validate name
    if (!name.trim()) {
      showToastRef.current(t('nameRequired', language), 'error');
      return;
    }

    // Validate phone (if provided)
    if (phone && phone.trim()) {
      const phoneRegex = /^[9][6-9][0-9]{8}$/;
      if (!phoneRegex.test(phone.trim())) {
        showToastRef.current(t('invalidPhone', language), 'error');
        return;
      }
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone || null,
          address: address || null,
          remarks: remarks || null
        }),
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        showToastRef.current(t('customerRegistered', language), 'success');
        // Reset form
        setName('');
        setPhone('');
        setAddress('');
        setRemarks('');
      } else {
        showToastRef.current(data.message || t('registrationFailed', language), 'error');
      }
    } catch (error) {
      console.error('Register error:', error);
      showToastRef.current(t('networkError', language), 'error');
    }
    setLoading(false);
  };

  return (
    <div className="space-y-5 pb-24">
      {/* Page Header - Consistent Blue Gradient */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-500 rounded-2xl p-6 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <IconNewCustomer className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">{t('newCustomer', language)}</h1>
            <p className="text-blue-100 text-base mt-1">{t('enterCustomerDetails', language)}</p>
          </div>
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-base font-semibold text-gray-800 mb-2">
              {t('fullName', language)} <span className="text-red-500"></span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={''}
              className="w-full p-4 text-lg border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all font-medium"
            />
          </div>

          <div>
            <label className="block text-base font-semibold text-gray-800 mb-2">
              {t('phone', language)} <span className="text-gray-400 text-sm">({t('optional', language)})</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={''}
              className="w-full p-4 text-lg border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all font-medium"
            />
            <p className="text-xs text-gray-400 mt-1">
              💡 {t('phoneHint', language)}
            </p>
          </div>

          <div>
            <label className="block text-base font-semibold text-gray-800 mb-2">
              {t('address', language)} <span className="text-gray-400 text-sm">({t('optional', language)})</span>
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder={''}
              className="w-full p-4 text-lg border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all font-medium"
            />
          </div>

          <div>
            <label className="block text-base font-semibold text-gray-800 mb-2">
              {t('remarks', language)} <span className="text-gray-400 text-sm">({t('optional', language)})</span>
            </label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows="3"
              placeholder={''}
              className="w-full p-4 text-lg border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all resize-none font-medium"
            />
          </div>

          <button
            onClick={registerCustomer}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-5 rounded-xl font-bold text-xl shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            {loading ? (
              <>
                <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
                {t('registering', language)}...
              </>
            ) : (
              <>
                <IconPlus className="w-6 h-6" />
                {t('registerCustomer', language)}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default NewCustomer;