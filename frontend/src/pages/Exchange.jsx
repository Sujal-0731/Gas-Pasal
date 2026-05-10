import React, { useState, useEffect, useRef } from 'react';
import { 
  IconSearch, 
  IconFilledCylinder, 
  IconEmptyCylinder,
  IconUsers,
  IconQueue,
  IconCheck,
  IconX
} from '../components/icons';
import { getAuthHeader } from '../utils/api';

const API_URL = import.meta.env.VITE_API_URL;
const cylinderOptions = ['लोकप्रिय', 'सुगम', 'एभरेस्ट', 'अन्य / Other', 'कोही छैन'];

function Exchange({ showToast, queueCustomer, onClearQueueCustomer }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [emptyCylinder, setEmptyCylinder] = useState('लोकप्रिय');
  const [filledCylinder, setFilledCylinder] = useState('लोकप्रिय');
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const searchTimeoutRef = useRef(null);

  useEffect(() => {
    if (queueCustomer) {
      // ✅ Fixed: Store complete customer info including queueId
      setSelectedCustomer({ 
        name: queueCustomer.customer_name,
        id: queueCustomer.customer_id,
        queueId: queueCustomer.id
      });
      setSearchTerm(queueCustomer.customer_name);
      setEmptyCylinder(queueCustomer.empty_cylinder);
      showToast(`क्यूबाट: ${queueCustomer.customer_name}`, 'success');
    }
  }, [queueCustomer, showToast]);

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!queueCustomer && searchTerm.length >= 2) {
      setSearching(true);
      searchTimeoutRef.current = setTimeout(() => {
        searchCustomer();
      }, 500);
    } else if (searchTerm.length < 2) {
      setSearchResults([]);
      setSearching(false);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm, queueCustomer]);

  const searchCustomer = async () => {
    setSearching(true);
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/customers?search=${encodeURIComponent(searchTerm)}`, {
        headers: getAuthHeader()
      });
      const data = await res.json();
      if (data.success) {
        setSearchResults(data.data);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      showToast('इन्टरनेट जडान जाँच गर्नुहोस्', 'error');
      setSearchResults([]);
    } finally {
      setLoading(false);
      setSearching(false);
    }
  };

  const selectCustomer = (customer) => {
    setSelectedCustomer(customer);
    setSearchTerm(customer.name);
    setSearchResults([]);
    setSearching(false);
  };

  const recordTransaction = async () => {
    if (!selectedCustomer) {
      showToast('कृपया पहिले ग्राहक खोज्नुहोस्', 'error');
      return;
    }

    // ✅ Added: Validate at least one cylinder is selected
    if ((!emptyCylinder || emptyCylinder === 'कोही छैन') && 
        (!filledCylinder || filledCylinder === 'कोही छैन')) {
      showToast('कृपया कम्तीमा एउटा सिलिन्डर चयन गर्नुहोस्', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({
          customerName: selectedCustomer.name,
          emptyCylinder,
          filledCylinder,
          remarks,
          queueId: queueCustomer?.id || null  // ✅ Fixed: Use correct property
        })
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        showToast('लेनदेन सफलतापूर्वक रेकर्ड गरियो', 'success');
        setRemarks('');
        
        // ✅ Fixed: Clear queue customer after successful transaction
        if (queueCustomer && onClearQueueCustomer) {
          onClearQueueCustomer();
        }
        
        // Reset form for new transaction
        if (!queueCustomer) {
          setSelectedCustomer(null);
          setSearchTerm('');
          setSearchResults([]);
        }
        
        // ✅ Reset cylinder selections
        setEmptyCylinder('लोकप्रिय');
        setFilledCylinder('लोकप्रिय');
        
      } else {
        showToast(data.message || 'लेनदेन रेकर्ड गर्न असफल', 'error');
      }
    } catch (error) {
      console.error('Transaction error:', error);
      showToast('इन्टरनेट जडान जाँच गर्नुहोस्', 'error');
    }
    setLoading(false);
  };

  const renderSearchStatus = () => {
    if (searching || loading) {
      return (
        <div className="text-center py-4 bg-blue-50 rounded-xl border border-blue-200 mt-3">
          <div className="flex items-center justify-center gap-2">
            <div className="w-6 h-6 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-base font-semibold text-blue-700">
              {searchTerm.length >= 2 ? 'ग्राहक खोज्दै...' : 'कृपया कम्तीमा २ अक्षर टाइप गर्नुहोस्'}
            </span>
          </div>
        </div>
      );
    }
    
    if (searchTerm.length >= 2 && searchResults.length === 0 && !searching && !loading) {
      return (
        <div className="text-center py-4 bg-yellow-50 rounded-xl border border-yellow-200 mt-3">
          <p className="text-base font-bold text-yellow-700">
            कुनै ग्राहक फेला परेन
          </p>
          <p className="text-sm text-yellow-600 mt-1">
            नयाँ ग्राहक थप्नको लागि "ग्राहक थप्नुहोस्" मा जानुहोस्
          </p>
        </div>
      );
    }
    
    return null;
  };

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        {/* Header Section */}
        <div className="p-4 bg-gradient-to-r from-blue-700 to-blue-500 border-b">
          <h2 className="text-2xl font-bold text-white">लेनदेन</h2>
          <p className="text-blue-50 text-base mt-1">सिलिन्डर विवरण भर्नुहोस्</p>
        </div>

        <div className="p-5">
          {/* Active Selection Display */}
          {(queueCustomer || selectedCustomer) && (
            <div className={`mb-5 p-4 rounded-xl border shadow-sm ${
              queueCustomer ? 'bg-purple-50 border-purple-200' : 'bg-blue-50 border-blue-200'
            }`}>
              <div className={`flex items-center gap-2 mb-1 ${queueCustomer ? 'text-purple-700' : 'text-blue-700'}`}>
                {queueCustomer ? <IconQueue className="w-5 h-5" /> : <IconUsers className="w-5 h-5" />}
                <span className="text-sm font-bold uppercase tracking-wide">
                  {queueCustomer ? 'क्यूबाट छानिएको' : 'छानिएको ग्राहक'}
                </span>
              </div>
              <p className="text-xl font-bold text-gray-900">{selectedCustomer?.name}</p>
              {queueCustomer && (
                <p className="text-base text-purple-800 mt-1 font-semibold">
                  ल्याएको सिलिन्डर: {queueCustomer.empty_cylinder}
                </p>
              )}
            </div>
          )}

          {/* Search Section */}
          <div className="mb-6">
            <label className="block text-lg font-bold text-gray-800 mb-2">
              ग्राहक खोज्नुहोस्
            </label>
            <div className="relative">
              <IconSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="नाम वा फोन नम्बरले खोज्नुहोस्..."
                className="w-full pl-11 pr-4 py-3 text-lg border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all font-semibold shadow-sm"
                disabled={!!queueCustomer}
              />
            </div>
            
            {!queueCustomer && (
              <>
                {renderSearchStatus()}
                
                {searchResults.length > 0 && !searching && !loading && (
                  <div className="mt-2 space-y-2 max-h-72 overflow-y-auto p-2 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                    {searchResults.map(customer => (
                      <div
                        key={customer.id}
                        onClick={() => selectCustomer(customer)}
                        className="p-3 bg-white rounded-lg cursor-pointer hover:bg-blue-50 hover:border-blue-400 border border-transparent transition-all shadow-sm"
                      >
                        <p className="text-lg font-bold text-gray-900">{customer.name}</p>
                        <p className="text-base text-gray-600 font-semibold mt-0.5">
                          {customer.phone ? `📱 ${customer.phone}` : 'मोबाइल नम्बर छैन'}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          <hr className="mb-6 border-gray-200" />

          {/* Cylinder Selection Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
            <div className="p-4 rounded-xl border border-red-100 shadow-sm">
              <label className="block text-base font-bold mb-2 flex items-center gap-2">
                <IconEmptyCylinder className="w-5 h-5" />
                १. खाली सिलिन्डर (ल्याएको)
              </label>
              <div className="relative">
                <select
                  value={emptyCylinder}
                  onChange={(e) => setEmptyCylinder(e.target.value)}
                  className="w-full p-3 text-lg font-bold border-2 border-gray-300 rounded-xl focus:border-blue-500 outline-none transition-colors appearance-none bg-white shadow-sm pr-12"
                >
                  {cylinderOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              <p className="text-xs font-semibold text-red-600 mt-2 italic text-center">
                नयाँ ग्राहक भए "कोही छैन" छान्नुहोस्
              </p>
            </div>

            <div className="p-4 rounded-xl border border-green-100 shadow-sm">
              <label className="block text-base font-bold mb-2 flex items-center gap-2">
                <IconFilledCylinder className="w-5 h-5" />
                २. भरिएको सिलिन्डर (दिने)
              </label>
              <div className="relative">
                <select
                  value={filledCylinder}
                  onChange={(e) => setFilledCylinder(e.target.value)}
                  className="w-full p-3 text-lg font-bold border-2 border-gray-300 rounded-xl focus:border-blue-500 outline-none transition-colors appearance-none bg-white shadow-sm pr-12"
                >
                  {cylinderOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              <p className="text-xs font-semibold text-green-600 mt-2 italic text-center">
                फिर्ता मात्र भए "कोही छैन" छान्नुहोस्
              </p>
            </div>
          </div>

          {/* Remarks Section */}
          <div className="mb-6">
            <label className="block text-lg font-bold text-gray-700 mb-2">
              कैफियत (हिसाब-किताब / अन्य)
            </label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows="2"
              placeholder="जस्तै: पैसा बाँकी वा केही जानकारी..."
              className="w-full p-3 text-base border-2 border-gray-300 rounded-xl focus:border-blue-500 outline-none transition-all resize-none font-semibold bg-gray-50 shadow-inner"
            />
          </div>

          {/* Submit Button */}
          <button
            onClick={recordTransaction}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold text-xl shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
                सेभ हुँदैछ...
              </>
            ) : (
              <>
                <IconCheck className="w-6 h-6" />
                लेनदेन रेकर्ड गर्नुहोस्
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Exchange;