import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  IconSearch, 
  IconFilledCylinder, 
  IconEmptyCylinder,
  IconUsers,
  IconQueue,
  IconCheck,
  IconX,
  IconPlus,
  IconEdit
} from '../components/icons';
import { useLanguage } from '../context/LanguageContext';
import { t } from '../utils/translations';
import { translateCylinder } from '../utils/cylinderTranslator';
import TransactionSuccessModal from '../components/ui/TransactionSuccessModal';
import useDebouncedSearch from '../hooks/useDebouncedSearch';
import { searchCustomers } from '../services/customerService';

const API_URL = import.meta.env.VITE_API_URL;

const cylinderValues = {
  lokpriya: 'लोकप्रिय',
  sugam: 'सुगम',
  everest: 'एभरेस्ट',
  other: 'अन्य / Other',
  none: 'कोही छैन'
};

function Exchange({ showToast, queueCustomer, onClearQueueCustomer, onNavigate }) {
  const { language } = useLanguage();
  
  const {
    searchTerm,
    setSearchTerm,
    results: searchResults,
    setResults,
    isSearching,
    clearSearch
  } = useDebouncedSearch(searchCustomers, { delay: 800, minChars: 3 });

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showSearch, setShowSearch] = useState(true);
  const [emptyCylinder, setEmptyCylinder] = useState(cylinderValues.lokpriya);
  const [filledCylinder, setFilledCylinder] = useState(cylinderValues.lokpriya);
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastTransaction, setLastTransaction] = useState(null);
  const [completedCustomer, setCompletedCustomer] = useState(null);
  
  const [customerError, setCustomerError] = useState('');
  const [cylinderError, setCylinderError] = useState('');
  const [stockError, setStockError] = useState('');
  const [shakeCustomer, setShakeCustomer] = useState(false);
  const [shakeCylinder, setShakeCylinder] = useState(false);
  
  const searchInputRef = useRef(null);
  const showToastRef = useRef(showToast);
  const customerSectionRef = useRef(null);
  const cylinderSectionRef = useRef(null);
  const isScrollingRef = useRef(false);

  useEffect(() => {
    showToastRef.current = showToast;
  }, [showToast]);

  // Clear customer error when customer is selected
  useEffect(() => {
    if (selectedCustomer) {
      setCustomerError('');
      setShowSearch(false);
    }
  }, [selectedCustomer]);

  // Clear cylinder error when cylinder selection changes
  useEffect(() => {
    if (emptyCylinder !== cylinderValues.none || filledCylinder !== cylinderValues.none) {
      setCylinderError('');
      setStockError('');
    }
  }, [emptyCylinder, filledCylinder]);

  const shakeElement = (elementRef, setShake) => {
    setShake(true);
    if (elementRef.current) {
      elementRef.current.classList.add('animate-shake');
      setTimeout(() => {
        if (elementRef.current) {
          elementRef.current.classList.remove('animate-shake');
        }
        setShake(false);
      }, 500);
    }
  };

  const scrollToElement = (elementRef, errorMessage, setError, setShake) => {
    // Prevent multiple scrolls
    if (isScrollingRef.current) return;
    isScrollingRef.current = true;
    
    setError(errorMessage);
    if (elementRef.current) {
      elementRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
      elementRef.current.classList.add('ring-2', 'ring-red-500', 'bg-red-50');
      shakeElement(elementRef, setShake);
      setTimeout(() => {
        if (elementRef.current) {
          elementRef.current.classList.remove('ring-2', 'ring-red-500', 'bg-red-50');
        }
        isScrollingRef.current = false;
      }, 1000);
    } else {
      isScrollingRef.current = false;
    }
  };

  // Handle queue customer selection
  useEffect(() => {
    if (queueCustomer) {
      setSelectedCustomer({ 
        name: queueCustomer.customer_name,
        id: queueCustomer.customer_id,
        queueId: queueCustomer.id
      });
      setSearchTerm(queueCustomer.customer_name);
      setEmptyCylinder(queueCustomer.empty_cylinder);
      setShowSearch(false);
      showToastRef.current(`${t('fromQueue', language)}: ${queueCustomer.customer_name}`, 'success');
    }
  }, [queueCustomer, language, setSearchTerm]);

  // Check for quick customer from Customer History
  useEffect(() => {
    const quickCustomer = sessionStorage.getItem('quickCustomer');
    if (quickCustomer && !selectedCustomer && !queueCustomer) {
      try {
        const customer = JSON.parse(quickCustomer);
        setSelectedCustomer({ 
          name: customer.name,
          id: customer.id
        });
        setSearchTerm(customer.name);
        setShowSearch(false);
        sessionStorage.removeItem('quickCustomer');
        if (showToast) showToast(`${customer.name} ${t('selectedForTransaction', language)}`, 'success');
      } catch (error) {
        console.error('Error parsing quick customer:', error);
      }
    }
  }, [selectedCustomer, queueCustomer, showToast, language, setSearchTerm]);

  const selectCustomer = (customer) => {
    if (!customer || !customer.id) {
      console.error('Invalid customer object');
      return;
    }
    
    const customerData = {
      id: customer.id,
      name: customer.name,
      phone: customer.phone || '',
      address: customer.address || ''
    };
    
    setSelectedCustomer(customerData);
    setSearchTerm(customer.name);
    setResults([]);
    setShowSearch(false);
    setCustomerError('');
    
    // Don't auto-scroll, just focus on remarks
    setTimeout(() => {
      const remarksInput = document.getElementById('remarks-input');
      if (remarksInput) {
        remarksInput.focus();
      }
    }, 100);
  };

  const handleChangeCustomer = () => {
    setSelectedCustomer(null);
    setSearchTerm('');
    setResults([]);
    setShowSearch(true);
    setCustomerError('');
    setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, 100);
  };

  const handleCloseModal = () => {
    setShowSuccessModal(false);
    setSelectedCustomer(null);
    setSearchTerm('');
    setResults([]);
    setShowSearch(true);
    setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, 100);
  };

  const handleViewCustomerHistory = () => {
    setShowSuccessModal(false);
    if (onNavigate && completedCustomer) {
      sessionStorage.setItem('viewCustomerHistory', JSON.stringify({
        id: completedCustomer.id,
        name: completedCustomer.name
      }));
      onNavigate('customers');
    }
  };

  const handleNewTransaction = () => {
    setShowSuccessModal(false);
    setSelectedCustomer(null);
    setSearchTerm('');
    setResults([]);
    setShowSearch(true);
    setEmptyCylinder(cylinderValues.lokpriya);
    setFilledCylinder(cylinderValues.lokpriya);
    setRemarks('');
    setCustomerError('');
    setCylinderError('');
    setStockError('');
    setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, 100);
  };

  const recordTransaction = async () => {
    setCustomerError('');
    setCylinderError('');
    setStockError('');
    
    if (!selectedCustomer) {
      scrollToElement(customerSectionRef, t('selectCustomerFirst', language), setCustomerError, setShakeCustomer);
      return;
    }

    if ((!emptyCylinder || emptyCylinder === cylinderValues.none) && 
        (!filledCylinder || filledCylinder === cylinderValues.none)) {
      scrollToElement(cylinderSectionRef, t('selectAtLeastOneCylinder', language), setCylinderError, setShakeCylinder);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          customerId: selectedCustomer.id,
          customerName: selectedCustomer.name,
          emptyCylinder: emptyCylinder,
          filledCylinder: filledCylinder,
          remarks,
          queueId: queueCustomer?.id || null
        }),
        credentials: 'include'
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        if (data.message && (data.message.includes('स्टक सकियो') || data.message.includes('stock'))) {
          scrollToElement(cylinderSectionRef, data.message, setStockError, setShakeCylinder);
        } else {
          showToastRef.current(data.message || t('transactionFailed', language), 'error');
        }
        setLoading(false);
        return;
      }
      
      if (data.success) {
        setCompletedCustomer({
          id: selectedCustomer.id,
          name: selectedCustomer.name
        });
        
        setLastTransaction({
          customerName: selectedCustomer.name,
          emptyCylinder: emptyCylinder,
          filledCylinder: filledCylinder,
          time: new Date().toLocaleTimeString()
        });
        
        setShowSuccessModal(true);
        showToastRef.current(t('transactionSuccess', language), 'success');
        setRemarks('');
        
        if (queueCustomer && onClearQueueCustomer) {
          onClearQueueCustomer();
        }
        
        setEmptyCylinder(cylinderValues.lokpriya);
        setFilledCylinder(cylinderValues.lokpriya);
      } else {
        showToastRef.current(data.message || t('transactionFailed', language), 'error');
      }
    } catch {
      console.error('Transaction error');
      showToastRef.current(t('networkError', language), 'error');
    } finally {
      setLoading(false);
    }
  };

  const renderSearchStatus = () => {
    if (isSearching) {
      return (
        <div className="text-center py-4 bg-blue-50 rounded-xl border border-blue-200 mt-3">
          <div className="flex items-center justify-center gap-2">
            <div className="w-6 h-6 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-base font-semibold text-blue-700">
              {searchTerm.length >= 3 ? t('searching', language) : t('typeMinChars', language)}
            </span>
          </div>
        </div>
      );
    }
    
    if (searchTerm.length >= 3 && searchResults.length === 0 && !isSearching) {
      return (
        <div className="text-center py-6 bg-yellow-50 rounded-xl border border-yellow-200 mt-3">
          <p className="text-base font-bold text-yellow-700">
            {t('noCustomerFound', language)}
          </p>
          <p className="text-sm text-yellow-600 mt-1">
            {t('addCustomerHint', language)}
          </p>
        </div>
      );
    }
    
    return null;
  };

  return (
    <>
      {showSuccessModal && lastTransaction && completedCustomer && (
        <TransactionSuccessModal
          transaction={lastTransaction}
          completedCustomer={completedCustomer}
          onClose={handleCloseModal}
          onViewHistory={handleViewCustomerHistory}
          onNewTransaction={handleNewTransaction}
          language={language}
        />
      )}

      <div className="space-y-5 pb-24">
        <div className="bg-gradient-to-r from-blue-700 to-blue-500 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <IconQueue className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">{t('exchange', language)}</h1>
              <p className="text-blue-100 text-base mt-1">{t('exchangeDesc', language)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
          {(queueCustomer || selectedCustomer) && (
            <div className={`p-5 border-b ${queueCustomer ? 'bg-purple-50 border-purple-200' : 'bg-blue-50 border-blue-200'}`}>
              <div className="flex justify-between items-center">
                <div>
                  <div className={`flex items-center gap-2 mb-2 ${queueCustomer ? 'text-purple-700' : 'text-blue-700'}`}>
                    {queueCustomer ? <IconQueue className="w-5 h-5" /> : <IconUsers className="w-5 h-5" />}
                    <span className="text-sm font-bold uppercase tracking-wide">
                      {queueCustomer ? t('selectedFromQueue', language) : t('selectedCustomer', language)}
                    </span>
                  </div>
                  <p className="text-xl font-bold text-gray-900">
                    {queueCustomer ? queueCustomer.customer_name : selectedCustomer?.name}
                  </p>
                  {queueCustomer && (
                    <p className="text-base text-purple-800 mt-1 font-semibold">
                      {t('broughtCylinder', language)}: {queueCustomer.empty_cylinder === cylinderValues.none 
                        ? t('none', language) 
                        : translateCylinder(queueCustomer.empty_cylinder, language)}
                    </p>
                  )}
                </div>
                
                {!queueCustomer && selectedCustomer && (
                  <button
                    onClick={handleChangeCustomer}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm font-semibold transition flex items-center gap-2"
                  >
                    <IconEdit className="w-4 h-4" />
                    {t('changeCustomer', language)}
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="p-6">
            {showSearch && !queueCustomer && (
              <div 
                ref={customerSectionRef} 
                className={`mb-6 transition-all duration-300 ${customerError ? 'border-red-500' : ''} ${shakeCustomer ? 'animate-shake' : ''}`}
              >
                <label className="block text-base font-semibold text-gray-800 mb-2">
                  {t('searchCustomer', language)} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <IconSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={t('searchByNameOrPhone', language)}
                    className={`w-full pl-11 pr-12 py-3 text-lg border-2 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all font-semibold shadow-sm ${
                      customerError ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                    autoFocus
                  />
                  {searchTerm && (
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        clearSearch();
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                    >
                      <IconX className="w-5 h-5" />
                    </button>
                  )}
                </div>
                {customerError && (
                  <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                    <span className="text-red-500">⚠️</span> {customerError}
                  </p>
                )}
                
                {renderSearchStatus()}
                
                {searchResults.length > 0 && !isSearching && (
                  <div className="mt-3 space-y-2 max-h-72 overflow-y-auto p-2 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                    {searchResults.map(customer => (
                      <div
                        key={customer.id}
                        onClick={() => selectCustomer(customer)}
                        className="p-3 bg-white rounded-lg cursor-pointer hover:bg-blue-50 hover:border-blue-400 border border-transparent transition-all shadow-sm"
                      >
                        <p className="text-lg font-bold text-gray-900">{customer.name}</p>
                        <p className="text-base text-gray-600 font-semibold mt-0.5">
                          {customer.phone ? `📱 ${customer.phone}` : t('noPhone', language)}
                        </p>
                        {customer.address && (
                          <p className="text-sm text-gray-400 mt-0.5">
                            📍 {customer.address}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {(selectedCustomer || queueCustomer) && (
              <>
                <hr className="mb-6 border-gray-200" />

                <div 
                  ref={cylinderSectionRef} 
                  className={`transition-all duration-300 ${cylinderError || stockError ? 'border-red-500' : ''} ${shakeCylinder ? 'animate-shake' : ''}`}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                    <div className="p-4 rounded-xl border border-red-100 shadow-sm bg-red-50/30">
                      <label className="block text-base font-bold mb-2 flex items-center gap-2 text-red-800">
                        <IconEmptyCylinder className="w-5 h-5" />
                        {t('emptyCylinderLabel', language)}
                      </label>
                      <div className="relative">
                        <select
                          value={emptyCylinder}
                          onChange={(e) => setEmptyCylinder(e.target.value)}
                          className="w-full p-3 text-lg font-bold border-2 border-gray-300 rounded-xl focus:border-blue-500 outline-none transition-colors appearance-none bg-white shadow-sm pr-12"
                          disabled={!!queueCustomer}
                        >
                          <option value={cylinderValues.lokpriya}>{translateCylinder('लोकप्रिय', language)}</option>
                          <option value={cylinderValues.sugam}>{translateCylinder('सुगम', language)}</option>
                          <option value={cylinderValues.everest}>{translateCylinder('एभरेस्ट', language)}</option>
                          <option value={cylinderValues.other}>{translateCylinder('अन्य / Other', language)}</option>
                          <option value={cylinderValues.none}>{t('none', language)}</option>
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                      <p className="text-xs font-semibold text-red-600 mt-2 italic text-center">
                        {t('newCustomerHint', language)}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl border border-green-100 shadow-sm bg-green-50/30">
                      <label className="block text-base font-bold mb-2 flex items-center gap-2 text-green-800">
                        <IconFilledCylinder className="w-5 h-5" />
                        {t('filledCylinderLabel', language)}
                      </label>
                      <div className="relative">
                        <select
                          value={filledCylinder}
                          onChange={(e) => setFilledCylinder(e.target.value)}
                          className={`w-full p-3 text-lg font-bold border-2 rounded-xl focus:border-blue-500 outline-none transition-colors appearance-none bg-white shadow-sm pr-12 ${
                            stockError ? 'border-red-500 bg-red-50' : 'border-gray-300'
                          }`}
                        >
                          <option value={cylinderValues.lokpriya}>{translateCylinder('लोकप्रिय', language)}</option>
                          <option value={cylinderValues.sugam}>{translateCylinder('सुगम', language)}</option>
                          <option value={cylinderValues.everest}>{translateCylinder('एभरेस्ट', language)}</option>
                          <option value={cylinderValues.other}>{translateCylinder('अन्य / Other', language)}</option>
                          <option value={cylinderValues.none}>{t('none', language)}</option>
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                      <p className="text-xs font-semibold text-green-600 mt-2 italic text-center">
                        {t('returnOnlyHint', language)}
                      </p>
                      {stockError && (
                        <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                          <span className="text-red-500">⚠️</span> {stockError}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {cylinderError && (
                    <p className="text-red-500 text-sm mb-4 flex items-center gap-1">
                      <span className="text-red-500">⚠️</span> {cylinderError}
                    </p>
                  )}
                </div>

                <div className="mb-6">
                  <label className="block text-base font-semibold text-gray-700 mb-2">
                    {t('remarks', language)}
                  </label>
                  <textarea
                    id="remarks-input"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    rows="2"
                    placeholder={t('remarksPlaceholder', language)}
                    className="w-full p-3 text-base border-2 border-gray-300 rounded-xl focus:border-blue-500 outline-none transition-all resize-none font-semibold bg-gray-50 shadow-inner"
                  />
                </div>

                <button
                  onClick={recordTransaction}
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold text-xl shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
                      {t('saving', language)}...
                    </>
                  ) : (
                    <>
                      <IconCheck className="w-6 h-6" />
                      {t('recordTransaction', language)}
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default Exchange;