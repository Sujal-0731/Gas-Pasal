import React, { useState, useEffect } from 'react';
import Exchange from './components/Exchange';
import NewCustomer from './components/NewCustomer';
import CustomerHistory from './components/CustomerHistory';
import DealerRefill from './components/DealerRefill';
import RefillHistory from './components/RefillHistory';
import StockSummary from './components/StockSummary';
import Queue from './components/Queue';

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
  const icon = type === 'success' ? '✅' : '❌';
  
  return (
    <div className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 z-[100] ${bgColor} text-white px-5 py-3 rounded-full shadow-lg flex items-center gap-2 animate-bounce-in`}>
      <span className="text-lg">{icon}</span>
      <span className="font-medium text-sm md:text-base">{message}</span>
      <button 
        onClick={onClose} 
        className="ml-2 text-white hover:text-gray-200 text-lg"
      >
        ✕
      </button>
    </div>
  );
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState('');
  const [activeTab, setActiveTab] = useState('exchange');
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const [queueCustomer, setQueueCustomer] = useState(null);
  const [showMenu, setShowMenu] = useState(false);

  // Simple showToast - no complex timeout management
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    // Auto hide after 3 seconds
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (showMenu) setShowMenu(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showMenu]);

  useEffect(() => {
    const savedAuth = localStorage.getItem('sujalAuth');
    if (savedAuth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handlePinSubmit = () => {
    if (pin === '1234') {
      localStorage.setItem('sujalAuth', 'true');
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('❌ गलत PIN / Wrong PIN');
      setPin('');
      setTimeout(() => setError(''), 2000);
    }
  };

  const handleSelectFromQueue = (queueItem) => {
    setQueueCustomer({
      name: queueItem.customer_name,
      emptyCylinder: queueItem.empty_cylinder,
      queueId: queueItem.id
    });
    setActiveTab('exchange');
    showToast(`✅ ${queueItem.customer_name} क्यूबाट चयन गरियो`, 'success');
  };

  const handleClearQueueCustomer = () => {
    setQueueCustomer(null);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-blue-900">Anam Store</h1>
            <p className="text-gray-600 mt-2">कृपया PIN प्रविष्ट गर्नुहोस्</p>
          </div>
          
          <div className="text-center mb-6">
            <div className="text-2xl tracking-wider font-mono mb-4">
              {'●'.repeat(pin.length)}{'○'.repeat(4 - pin.length)}
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                onClick={() => pin.length < 4 && setPin(prev => prev + num)}
                className="bg-gray-200 hover:bg-gray-300 text-2xl font-bold py-4 rounded-xl"
              >
                {num}
              </button>
            ))}
            <button
              onClick={() => setPin(prev => prev.slice(0, -1))}
              className="bg-gray-200 hover:bg-gray-300 text-xl font-bold py-4 rounded-xl"
            >
              ⌫
            </button>
            <button
              onClick={() => pin.length < 4 && setPin(prev => prev + '0')}
              className="bg-gray-200 hover:bg-gray-300 text-2xl font-bold py-4 rounded-xl"
            >
              0
            </button>
            <button
              onClick={handlePinSubmit}
              className="bg-blue-900 hover:bg-blue-800 text-white text-xl font-bold py-4 rounded-xl"
            >
              ✅
            </button>
          </div>
          
          {error && <p className="text-red-600 text-center text-lg">{error}</p>}
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'exchange', label: '💰 लेनदेन' },
    { id: 'newcustomer', label: '🆕 नयाँ ग्राहक' },
    { id: 'history', label: '📜 ग्राहक इतिहास' },
    { id: 'queue', label: '📋 पर्खने सूची' },
    { id: 'dealer', label: '🚚 डिलर रिफिल' },
    { id: 'refillhistory', label: '📋 रिफिल इतिहास' },
    { id: 'stock', label: '📦 स्टक' }
  ];

  return (
    <>
      {/* Toast - Fixed at bottom center, outside everything */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}

      <div className="max-w-lg mx-auto p-4 pb-24">
        {/* Header with Settings Dropdown */}
        <div className="bg-blue-900 text-white rounded-2xl p-5 mb-5 shadow-lg">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">🏪 Anam Store</h1>
              <p className="text-sm opacity-90 mt-1">लोकप्रिय · सुगम · एभरेस्ट</p>
            </div>
            
            {/* Settings Gear Dropdown */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
                className="text-gray-300 hover:text-white hover:bg-gray-700 w-8 h-8 rounded-full flex items-center justify-center text-lg transition"
              >
                ⚙️
              </button>
              
              {showMenu && (
                <div className="absolute right-0 mt-2 w-36 bg-white rounded-lg shadow-lg overflow-hidden z-50">
                  <button
                    onClick={() => {
                      localStorage.removeItem('sujalAuth');
                      window.location.reload();
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 transition flex items-center gap-2"
                  >
                    🚪 Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2 mb-5 overflow-x-auto pb-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-full font-semibold whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-blue-900 text-white'
                  : 'bg-white text-gray-700 border border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mt-4">
          {activeTab === 'exchange' && (
            <Exchange 
              showToast={showToast}
              queueCustomer={queueCustomer}
              onClearQueueCustomer={handleClearQueueCustomer}
            />
          )}
          {activeTab === 'newcustomer' && <NewCustomer showToast={showToast} />}
          {activeTab === 'history' && <CustomerHistory showToast={showToast} />}
          {activeTab === 'queue' && <Queue showToast={showToast} onSelectCustomerFromQueue={handleSelectFromQueue} />}
          {activeTab === 'dealer' && <DealerRefill showToast={showToast} />}
          {activeTab === 'refillhistory' && <RefillHistory />}
          {activeTab === 'stock' && <StockSummary />}
        </div>
      </div>
    </>
  );
}

export default App;