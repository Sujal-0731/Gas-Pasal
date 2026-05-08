import React, { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL;
const PIN_CODE = import.meta.env.VITE_PIN_CODE;

function CustomerHistory({ showToast }) {
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/customers`, {
        headers: { 'x-pin': PIN_CODE }
      });
      const data = await res.json();
      if (data.success) {
        setCustomers(data.data);
      }
    } catch (error) {
      console.error('Error loading customers:', error);
      if (showToast) showToast('ग्राहक लोड गर्न असफल', 'error');
    }
    setLoading(false);
  };

  // Make phone call
  const makePhoneCall = (phoneNumber) => {
    if (!phoneNumber) {
      if (showToast) showToast('फोन नम्बर उपलब्ध छैन', 'error');
      return;
    }
    window.location.href = `tel:${phoneNumber}`;
  };

  // Copy phone number
  const copyPhoneNumber = async (phoneNumber) => {
    if (!phoneNumber) return;
    try {
      await navigator.clipboard.writeText(phoneNumber);
      if (showToast) showToast(`${phoneNumber} कपी गरियो`, 'success');
    } catch (err) {
      console.error('Failed to copy:', err);
      if (showToast) showToast('कपी गर्न असफल', 'error');
    }
  };

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const viewHistory = async (customer) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/customers/${encodeURIComponent(customer.name)}/history`, {
        headers: { 'x-pin': PIN_CODE }
      });
      const data = await res.json();
      if (data.success) {
        setSelectedCustomer(customer);
        setHistory(data);
      }
    } catch (error) {
      console.error('Error loading history:', error);
      if (showToast) showToast('इतिहास लोड गर्न असफल', 'error');
    }
    setLoading(false);
  };

  if (selectedCustomer) {
    return (
      <div className="bg-white rounded-2xl p-5 shadow-md">
        <button
          onClick={() => { setSelectedCustomer(null); setHistory(null); }}
          className="mb-4 bg-gray-500 text-white px-5 py-2 rounded-full text-base font-medium"
        >
          ← सबै ग्राहक
        </button>

        <div className="bg-indigo-50 p-4 rounded-xl mb-4">
          <div className="flex justify-between mb-2 flex-wrap gap-2">
            <span className="font-bold">🆔 ID:</span>
            <span>{history?.customer?.customer_id}</span>
          </div>
          <div className="flex justify-between mb-2 flex-wrap gap-2">
            <span className="font-bold">👤 नाम:</span>
            <span>{history?.customer?.name}</span>
          </div>
          <div className="flex justify-between mb-2 flex-wrap gap-2">
            <span className="font-bold">📞 फोन:</span>
            <div className="flex items-center gap-2">
              <span>{history?.customer?.phone || 'छैन'}</span>
              {history?.customer?.phone && (
                <>
                  <button
                    onClick={() => makePhoneCall(history.customer.phone)}
                    className="bg-green-500 text-white px-3 py-1 rounded-full text-sm"
                  >
                    📞 कल
                  </button>
                  <button
                    onClick={() => copyPhoneNumber(history.customer.phone)}
                    className="bg-gray-500 text-white px-3 py-1 rounded-full text-sm"
                  >
                    📋 कपी
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="flex justify-between mb-2 flex-wrap gap-2">
            <span className="font-bold">📍 ठेगाना:</span>
            <span>{history?.customer?.address || 'छैन'}</span>
          </div>
          <div className="flex justify-between mb-2 flex-wrap gap-2">
            <span className="font-bold">📝 कैफियत:</span>
            <span>{history?.customer?.remarks || 'छैन'}</span>
          </div>
        </div>

        <div className="bg-blue-900 text-white text-center py-3 rounded-full mb-4 font-bold">
          📊 कुल लेनदेन: {history?.totalExchanges || 0}
        </div>

        {history?.transactions?.length === 0 ? (
          <div className="text-center text-gray-500 py-8">📭 कुनै लेनदेन छैन</div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {history?.transactions?.map((t, idx) => (
              <div key={idx} className="bg-gray-100 p-3 rounded-xl border-l-4 border-orange-500">
                <div className="flex justify-between items-start flex-wrap gap-2">
                  <div className="font-bold">📅 {t.date} | ⏰ {t.time}</div>
                  {t.source === 'queue' && (
                    <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">
                      📋 क्यूबाट
                    </span>
                  )}
                </div>
                
                {t.source === 'queue' && t.queue_date_formatted && (
                  <div className="text-xs text-blue-600 mt-1">
                    📌 क्यूमा थपिएको: {t.queue_date_formatted} {t.queue_time_formatted ? `| ⏰ ${t.queue_time_formatted}` : ''}
                  </div>
                )}
                
                <div className="flex justify-between mt-2 flex-wrap gap-2">
                  <span className="text-red-600">
                    📤 खाली: {t.empty_cylinder === 'कोही छैन' ? '🆕 नयाँ खरिद (कोही छैन)' : t.empty_cylinder}
                  </span>
                  <span className="text-green-600">
                    📥 भरिएको: {t.filled_cylinder === 'कोही छैन' ? '🔄 फिर्ता (कोही छैन)' : t.filled_cylinder}
                  </span>
                </div>
                {t.remarks && <div className="text-sm text-gray-500 mt-2">📝 {t.remarks}</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-5 shadow-md">
      <h2 className="text-xl font-bold text-blue-900 border-l-4 border-orange-500 pl-3 mb-4">
        📜 ग्राहक इतिहास
      </h2>

      <div className="mb-4">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="🔍 ग्राहक खोज्नुहोस्..."
          className="w-full p-4 border-2 border-gray-300 rounded-xl text-lg"
        />
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">⏳ लोड हुँदै...</div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredCustomers.map(customer => (
            <div
              key={customer.id}
              onClick={() => viewHistory(customer)}
              className="bg-gray-100 p-3 rounded-xl cursor-pointer active:bg-gray-200"
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-bold text-lg">👤 {customer.name}</div>
                  <div className="text-sm text-gray-600">📞 {customer.phone || 'नम्बर छैन'}</div>
                </div>
                {customer.phone && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      makePhoneCall(customer.phone);
                    }}
                    className="bg-green-500 text-white px-3 py-2 rounded-full text-sm"
                  >
                    📞 कल
                  </button>
                )}
              </div>
            </div>
          ))}
          {filteredCustomers.length === 0 && (
            <div className="text-center text-gray-500 py-8">📭 कुनै ग्राहक छैन</div>
          )}
        </div>
      )}
    </div>
  );
}

export default CustomerHistory;