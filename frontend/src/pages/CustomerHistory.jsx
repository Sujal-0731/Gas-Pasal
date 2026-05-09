import React, { useState, useEffect } from 'react';
import { 
  IconSearch, 
  IconPhone, 
  IconCopy, 
  IconChevronLeft,
  IconFilledCylinder,
  IconEmptyCylinder,
  IconReturn,
  IconNewPurchase,
  IconQueue,
  IconAlertCircle,
  IconUsers
} from '../components/icons';

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

  const makePhoneCall = (phoneNumber) => {
    if (!phoneNumber) {
      if (showToast) showToast('फोन नम्बर उपलब्ध छैन', 'error');
      return;
    }
    window.location.href = `tel:${phoneNumber}`;
  };

  const copyPhoneNumber = async (phoneNumber) => {
    if (!phoneNumber) return;
    try {
      await navigator.clipboard.writeText(phoneNumber);
      if (showToast) showToast(`${phoneNumber} कपी गरियो`, 'success');
    } catch (err) {
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
      <div className="space-y-5">
        <button
          onClick={() => { setSelectedCustomer(null); setHistory(null); }}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors font-medium text-base"
        >
          <IconChevronLeft className="w-6 h-6" />
          <span className="text-base font-bold">सबै ग्राहक</span>
        </button>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5">
            <div className="flex justify-between items-center">
              <h3 className="text-white font-bold text-xl">ग्राहक विवरण</h3>
              {history?.customer?.phone && (
                <button
                  onClick={() => makePhoneCall(history.customer.phone)}
                  className="bg-white/20 hover:bg-white/30 text-white px-5 py-2 rounded-full text-base font-semibold transition-colors flex items-center gap-2"
                >
                  <IconPhone className="w-5 h-5" />
                  कल गर्नुहोस्
                </button>
              )}
            </div>
          </div>
          
          <div className="p-6 space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-base font-bold text-gray-600">पहिचान</span>
              <span className="text-gray-900 font-mono text-base font-medium">{history?.customer?.customer_id}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <IconUsers className="w-5 h-5 text-gray-400" />
                <span className="text-base font-bold text-gray-600">नाम</span>
              </div>
              <span className="text-gray-900 font-bold text-lg">{history?.customer?.name}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-base font-bold text-gray-600">सम्पर्क</span>
              <div className="flex items-center gap-2">
                <span className="text-gray-900 text-base font-medium">{history?.customer?.phone || 'छैन'}</span>
                {history?.customer?.phone && (
                  <>
                    <button
                      onClick={() => copyPhoneNumber(history.customer.phone)}
                      className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                      title="कपी गर्नुहोस्"
                    >
                      <IconCopy className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-base font-bold text-gray-600">ठेगाना</span>
              <span className="text-gray-900 text-base font-medium">{history?.customer?.address || 'छैन'}</span>
            </div>
            <div className="flex justify-between items-center py-3">
              <span className="text-base font-bold text-gray-600">कैफियत</span>
              <span className="text-gray-900 text-base font-medium">{history?.customer?.remarks || 'छैन'}</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white text-center py-4 rounded-xl font-bold text-xl">
          कुल लेनदेन: {history?.totalExchanges || 0}
        </div>

        {history?.transactions?.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center text-gray-400">
            <IconAlertCircle className="w-14 h-14 mx-auto mb-3 opacity-50" />
            <p className="text-lg font-medium">कुनै लेनदेन छैन</p>
          </div>
        ) : (
          <div className="space-y-4">
            {history?.transactions?.map((t, idx) => (
              <div key={idx} className="bg-white rounded-xl p-5 shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900 text-base">{t.date}</span>
                    <span className="text-sm text-gray-500">| {t.time}</span>
                  </div>
                  {t.source === 'queue' && (
                    <span className="bg-purple-100 text-purple-700 text-sm px-3 py-1.5 rounded-full flex items-center gap-1 font-semibold">
                      <IconQueue className="w-4 h-4" />
                      क्यूबाट
                    </span>
                  )}
                </div>
                
                {t.source === 'queue' && t.queue_date_formatted && (
                  <div className="text-sm text-blue-600 mb-3 flex items-center gap-1 font-medium">
                    <span>क्यूमा थपिएको: {t.queue_date_formatted} {t.queue_time_formatted ? `| ${t.queue_time_formatted}` : ''}</span>
                  </div>
                )}
                
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <IconEmptyCylinder className="w-5 h-5 text-red-500" />
                    <span className="text-base font-semibold text-gray-800">
                      {t.empty_cylinder === 'कोही छैन' ? 'नयाँ खरिद' : t.empty_cylinder}
                    </span>
                  </div>
                  <span className="text-gray-400 text-xl font-bold">→</span>
                  <div className="flex items-center gap-2">
                    <IconFilledCylinder className="w-5 h-5 text-green-600" />
                    <span className="text-base font-bold text-green-700">
                      {t.filled_cylinder === 'कोही छैन' ? 'फिर्ता' : t.filled_cylinder}
                    </span>
                  </div>
                </div>
                
                {t.remarks && (
                  <div className="mt-3 text-sm text-gray-500 pt-2 border-t border-gray-100 font-medium">
                    {t.remarks}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
  <div className='space-y-5'> 
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      <div className="p-4 bg-gradient-to-r from-blue-700 to-blue-500 border-b">
        <h2 className="text-2xl font-bold text-white">ग्राहक इतिहास</h2>
        <p className="text-blue-50 text-base mt-1">ग्राहक खोज्नुहोस् र लेनदेन हेर्नुहोस्</p>
      </div>

      <div className="p-6">
        <div className="relative mb-6">
          <IconSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ग्राहकको नाम लेख्नुहोस्..."
            className="w-full pl-12 pr-4 py-4 text-lg border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all font-medium"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <IconAlertCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">कुनै ग्राहक छैन</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {filteredCustomers.map(customer => (
              <div
                key={customer.id}
                onClick={() => viewHistory(customer)}
                className="flex items-center justify-between p-5 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors group border-2 border-transparent hover:border-blue-200"
              >
                <div>
                  <p className="font-bold text-gray-900 text-lg group-hover:text-blue-600 transition-colors">
                    {customer.name}
                  </p>
                  <p className="text-base text-gray-600 mt-1 font-medium">{customer.phone || 'नम्बर छैन'}</p>
                </div>
                {customer.phone && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      makePhoneCall(customer.phone);
                    }}
                    className="p-3 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
                  >
                    <IconPhone className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  </div>
  );
}

export default CustomerHistory;