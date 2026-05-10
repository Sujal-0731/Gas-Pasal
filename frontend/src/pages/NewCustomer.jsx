import React, { useState } from 'react';
import { IconPlus, IconCheck, IconX, IconNewCustomer } from '../components/icons';
import { getAuthHeader } from '../utils/api';

const API_URL = import.meta.env.VITE_API_URL;

function NewCustomer({ showToast }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);

  const registerCustomer = async () => {
    // Validate name
    if (!name.trim()) {
      showToast('कृपया ग्राहकको नाम लेख्नुहोस्', 'error');
      return;
    }

    // Validate phone (if provided)
    if (phone && phone.trim()) {
      const phoneRegex = /^[9][6-9][0-9]{8}$/;
      if (!phoneRegex.test(phone.trim())) {
        showToast('फोन नम्बर गलत छ (९८xxxxxxxx वा ९७xxxxxxxx)', 'error');
        return;
      }
    }

    setLoading(true);
    try {
      // ✅ CORRECT - POST request with body
      const response = await fetch(`${API_URL}/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone || null,
          address: address || null,
          remarks: remarks || null
        })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        showToast('ग्राहक दर्ता सफल भयो', 'success');
        // Reset form
        setName('');
        setPhone('');
        setAddress('');
        setRemarks('');
      } else {
        showToast(data.message || 'ग्राहक दर्ता असफल', 'error');
      }
    } catch (error) {
      console.error('Register error:', error);
      showToast('इन्टरनेट जडान जाँच गर्नुहोस्', 'error');
    }
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
        <div className="flex items-center gap-3">
          <IconNewCustomer className="w-8 h-8 text-blue-600" />
          <h2 className="text-2xl font-black text-gray-900">नयाँ ग्राहक दर्ता</h2>
        </div>
        <p className="text-base text-gray-600 mt-1 font-medium">ग्राहकको विवरण भर्नुहोस्</p>
      </div>

      <div className="p-6 space-y-6">
        <div>
          <label className="block text-lg font-bold text-gray-800 mb-2">
            पुरा नाम <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder=""
            className="w-full p-4 text-lg border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all font-medium"
          />
        </div>

        <div>
          <label className="block text-lg font-bold text-gray-800 mb-2">
            फोन नम्बर <span className="text-gray-400 text-sm">(वैकल्पिक)</span>
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder=""
            className="w-full p-4 text-lg border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all font-medium"
          />
        </div>

        <div>
          <label className="block text-lg font-bold text-gray-800 mb-2">
            ठेगाना <span className="text-gray-400 text-sm">(वैकल्पिक)</span>
          </label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder=""
            className="w-full p-4 text-lg border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all font-medium"
          />
        </div>

        <div>
          <label className="block text-lg font-bold text-gray-800 mb-2">
            कैफियत <span className="text-gray-400 text-sm">(वैकल्पिक)</span>
          </label>
          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            rows="3"
            placeholder=""
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
              दर्ता गर्दै...
            </>
          ) : (
            <>
              <IconPlus className="w-6 h-6" />
              ग्राहक दर्ता गर्नुहोस्
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default NewCustomer;