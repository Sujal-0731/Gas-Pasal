import React, { useState, useEffect } from 'react';
import Exchange from './components/Exchange';
import NewCustomer from './components/NewCustomer';
import CustomerHistory from './components/CustomerHistory';
import DealerRefill from './components/DealerRefill';
import RefillHistory from './components/RefillHistory';
import StockSummary from './components/StockSummary';
import Queue from './components/Queue';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState('');
  const [activeTab, setActiveTab] = useState('exchange');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [queueCustomer, setQueueCustomer] = useState(null);

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
    setMessage(`✅ ${queueItem.customer_name} क्यूबाट चयन गरियो`);
    setTimeout(() => setMessage(''), 3000);
  };

  const handleClearQueueCustomer = () => {
    setQueueCustomer(null);
  };

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
            setMessage={setMessage} 
            queueCustomer={queueCustomer}
            onClearQueueCustomer={handleClearQueueCustomer}
          />
        )}
        {activeTab === 'newcustomer' && <NewCustomer setMessage={setMessage} />}
        {activeTab === 'history' && <CustomerHistory />}
        {activeTab === 'queue' && <Queue setMessage={setMessage} onSelectCustomerFromQueue={handleSelectFromQueue} />}
        {activeTab === 'dealer' && <DealerRefill setMessage={setMessage} />}
        {activeTab === 'refillhistory' && <RefillHistory />}
        {activeTab === 'stock' && <StockSummary />}
      </div>

      <button
        onClick={() => {
          localStorage.removeItem('sujalAuth');
          window.location.reload();
        }}
        className="w-full bg-red-600 text-white py-3 rounded-full font-semibold mt-4"
      >
        🚪 लगआउट / Logout
      </button>
    </div>
  );
}

export default App;