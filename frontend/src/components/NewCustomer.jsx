import React, { useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL;
const PIN_CODE = import.meta.env.VITE_PIN_CODE;

function NewCustomer({ setMessage }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);

  const registerCustomer = async () => {
    if (!name.trim()) {
      setMessage('❌ कृपया ग्राहकको नाम लेख्नुहोस्');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-pin': PIN_CODE
        },
        body: JSON.stringify({ name, phone, address, remarks })
      });
      const data = await res.json();
      if (data.success) {
        setMessage('✅ ग्राहक दर्ता सफल भयो');
        setName('');
        setPhone('');
        setAddress('');
        setRemarks('');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('❌ ' + data.message);
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      setMessage('❌ इन्टरनेट जडान जाँच गर्नुहोस्');
      setTimeout(() => setMessage(''), 3000);
    }
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-2xl p-5 shadow-md">
      <h2 className="text-xl font-bold text-blue-900 border-l-4 border-orange-500 pl-3 mb-4">
        🆕 नयाँ ग्राहक दर्ता
      </h2>

      <div className="mb-4">
        <label className="block font-semibold mb-2 text-lg">👤 पुरा नाम *</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="रामेश गुप्ता"
          className="w-full p-4 border-2 border-gray-300 rounded-xl text-lg focus:border-blue-500 outline-none"
        />
      </div>

      <div className="mb-4">
        <label className="block font-semibold mb-2 text-lg">📞 फोन नम्बर</label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="९८७६५४३२१०"
          className="w-full p-4 border-2 border-gray-300 rounded-xl text-lg focus:border-blue-500 outline-none"
        />
      </div>

      <div className="mb-4">
        <label className="block font-semibold mb-2 text-lg">📍 ठेगाना</label>
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="गान्धी नगर"
          className="w-full p-4 border-2 border-gray-300 rounded-xl text-lg focus:border-blue-500 outline-none"
        />
      </div>

      <div className="mb-4">
        <label className="block font-semibold mb-2 text-lg">📝 कैफियत</label>
        <textarea
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          rows="2"
          placeholder="जम्मा रु.२०० बाँकी"
          className="w-full p-4 border-2 border-gray-300 rounded-xl text-lg focus:border-blue-500 outline-none"
        />
      </div>

      <button
        onClick={registerCustomer}
        disabled={loading}
        className="w-full bg-blue-900 text-white py-4 rounded-full font-bold text-lg active:bg-orange-500 transition disabled:opacity-50"
      >
        ✅ ग्राहक दर्ता गर्नुहोस्
      </button>
    </div>
  );
}

export default NewCustomer;