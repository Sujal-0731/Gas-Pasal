import React, { useState, useEffect } from 'react';
import Exchange from './components/Exchange';
import NewCustomer from './components/NewCustomer';
import CustomerHistory from './components/CustomerHistory';
import DealerRefill from './components/DealerRefill';
import RefillHistory from './components/RefillHistory';  
import StockSummary from './components/StockSummary';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState('');
  const [activeTab, setActiveTab] = useState('exchange');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

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

  // PIN Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-blue-900">🏪 सुजल स्टोर</h1>
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
                className="bg-gray-200 hover:bg-gray-300 text-2xl font-bold py-4 rounded-xl transition active:scale-95"
              >
                {num}
              </button>
            ))}
            <button
              onClick={() => setPin(prev => prev.slice(0, -1))}
              className="bg-gray-200 hover:bg-gray-300 text-xl font-bold py-4 rounded-xl transition active:scale-95"
            >
              ⌫
            </button>
            <button
              onClick={() => pin.length < 4 && setPin(prev => prev + '0')}
              className="bg-gray-200 hover:bg-gray-300 text-2xl font-bold py-4 rounded-xl transition active:scale-95"
            >
              0
            </button>
            <button
              onClick={handlePinSubmit}
              className="bg-blue-900 hover:bg-blue-800 text-white text-xl font-bold py-4 rounded-xl transition active:scale-95"
            >
              ✅
            </button>
          </div>
          
          {error && <p className="text-red-600 text-center text-lg">{error}</p>}
        </div>
      </div>
    );
  }

  // Main App - 6 Tabs (Added Refill History)
  return (
    <div className="max-w-lg mx-auto p-4 pb-24">
      <div className="bg-blue-900 text-white rounded-2xl p-5 mb-5 text-center shadow-lg">
        <h1 className="text-2xl font-bold">🏪 सुजल स्टोर</h1>
        <p className="text-sm opacity-90">लोकप्रिय · सुगम · एभरेस्ट</p>
      </div>

      {message && (
        <div className="mb-4 p-3 rounded-xl text-center bg-green-100 text-green-700">
          {message}
        </div>
      )}

      <div className="flex gap-2 mb-5 overflow-x-auto pb-2">
        {[
          { id: 'exchange', label: '💰 लेनदेन' },
          { id: 'newcustomer', label: '🆕 नयाँ ग्राहक' },
          { id: 'history', label: '📜 ग्राहक इतिहास' },
          { id: 'dealer', label: '🚚 डिलर रिफिल' },
          { id: 'refillhistory', label: '📋 रिफिल इतिहास' },  // ← NEW TAB
          { id: 'stock', label: '📦 स्टक' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-3 rounded-full font-semibold whitespace-nowrap transition active:scale-95 ${
              activeTab === tab.id
                ? 'bg-blue-900 text-white shadow-md'
                : 'bg-white text-gray-700 border border-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {activeTab === 'exchange' && <Exchange setMessage={setMessage} />}
        {activeTab === 'newcustomer' && <NewCustomer setMessage={setMessage} />}
        {activeTab === 'history' && <CustomerHistory />}
        {activeTab === 'dealer' && <DealerRefill setMessage={setMessage} />}
        {activeTab === 'refillhistory' && <RefillHistory />}  
        {activeTab === 'stock' && <StockSummary />}
      </div>

      <button
        onClick={() => {
          localStorage.removeItem('sujalAuth');
          window.location.reload();
        }}
        className="w-full bg-red-600 text-white py-3 rounded-full font-semibold mt-4 active:bg-red-700 transition"
      >
        🚪 लगआउट / Logout
      </button>
    </div>
  );
}

export default App;