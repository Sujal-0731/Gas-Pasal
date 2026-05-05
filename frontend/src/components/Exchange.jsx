import React, { useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL;
const PIN_CODE = import.meta.env.VITE_PIN_CODE;

function Exchange({ setMessage }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [emptyCylinder, setEmptyCylinder] = useState('लोकप्रिय');
  const [filledCylinder, setFilledCylinder] = useState('लोकप्रिय');
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);

  const searchCustomer = async () => {
    if (searchTerm.length < 2) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/customers?search=${encodeURIComponent(searchTerm)}`, {
        headers: { 'x-pin': PIN_CODE }
      });
      const data = await res.json();
      if (data.success) {
        setSearchResults(data.data);
      }
    } catch (error) {
      console.error('Search error:', error);
      setMessage('❌ इन्टरनेट जडान जाँच गर्नुहोस्');
    }
    setLoading(false);
  };

  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm.length >= 2) searchCustomer();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const selectCustomer = (customer) => {
    setSelectedCustomer(customer);
    setSearchTerm(customer.name);
    setSearchResults([]);
  };

  const recordTransaction = async () => {
    if (!selectedCustomer) {
      setMessage('❌ कृपया पहिले ग्राहक खोज्नुहोस्');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-pin': PIN_CODE
        },
        body: JSON.stringify({
          customerName: selectedCustomer.name,
          emptyCylinder,
          filledCylinder,
          remarks
        })
      });
      const data = await res.json();
      if (data.success) {
        setMessage('✅ लेनदेन सफलतापूर्वक रेकर्ड गरियो');
        setRemarks('');
      } else {
        setMessage('❌ ' + data.message);
      }
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('❌ इन्टरनेट जडान जाँच गर्नुहोस्');
      setTimeout(() => setMessage(''), 3000);
    }
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-2xl p-5 shadow-md">
      <h2 className="text-xl font-bold text-blue-900 border-l-4 border-orange-500 pl-3 mb-4">
        📝 सिलिन्डर लेनदेन
      </h2>

      {selectedCustomer && (
        <div className="bg-blue-50 p-3 rounded-xl mb-4 border-l-4 border-blue-500">
          <div className="text-sm text-blue-600">✅ चयन गरिएको ग्राहक</div>
          <div className="font-bold text-lg">{selectedCustomer.name}</div>
        </div>
      )}

      <div className="mb-4">
        <label className="block font-semibold mb-2 text-lg">🔍 ग्राहक खोज्नुहोस्</label>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="नाम लेख्नुहोस्..."
          className="w-full p-4 border-2 border-gray-300 rounded-xl text-lg"
        />
        {loading && <div className="text-center py-2">⏳ खोज्दै...</div>}
        {searchResults.length > 0 && (
          <div className="mt-3 max-h-60 overflow-y-auto">
            {searchResults.map(customer => (
              <div
                key={customer.id}
                onClick={() => selectCustomer(customer)}
                className="bg-gray-100 p-3 rounded-xl mb-2 cursor-pointer"
              >
                <div className="font-bold text-lg">{customer.name}</div>
                <div className="text-sm text-gray-600">📞 {customer.phone || 'नम्बर छैन'}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mb-4">
        <label className="block font-semibold mb-2 text-lg">🔄 खाली सिलिन्डर (ल्याएको)</label>
        <select
          value={emptyCylinder}
          onChange={(e) => setEmptyCylinder(e.target.value)}
          className="w-full p-4 border-2 border-gray-300 rounded-xl text-lg"
        >
          <option>लोकप्रिय</option>
          <option>सुगम</option>
          <option>एभरेस्ट</option>
        </select>
      </div>

      <div className="mb-4">
        <label className="block font-semibold mb-2 text-lg">🔄 भरिएको सिलिन्डर (लैजाने)</label>
        <select
          value={filledCylinder}
          onChange={(e) => setFilledCylinder(e.target.value)}
          className="w-full p-4 border-2 border-gray-300 rounded-xl text-lg"
        >
          <option>लोकप्रिय</option>
          <option>सुगम</option>
          <option>एभरेस्ट</option>
        </select>
      </div>

      <div className="mb-4">
        <label className="block font-semibold mb-2 text-lg">📝 कैफियत</label>
        <textarea
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          rows="2"
          placeholder="जस्तै: रु.५०० बाँकी"
          className="w-full p-4 border-2 border-gray-300 rounded-xl text-lg"
        />
      </div>

      <button
        onClick={recordTransaction}
        disabled={loading}
        className="w-full bg-blue-900 text-white py-4 rounded-full font-bold text-lg"
      >
        💾 लेनदेन रेकर्ड गर्नुहोस्
      </button>
    </div>
  );
}

export default Exchange;