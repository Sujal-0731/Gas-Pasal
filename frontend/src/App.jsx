import React, { useState, useEffect } from 'react';
import { MainLayout } from './components/layout/MainLayout';
import { Dashboard } from './pages/Dashboard';
import Exchange from './pages/Exchange';
import NewCustomer from './pages/NewCustomer';
import CustomerHistory from './pages/CustomerHistory';
import DealerRefill from './pages/DealerRefill';
import RefillHistory from './pages/RefillHistory';
import StockSummary from './pages/StockSummary';
import Queue from './pages/Queue';
import { Toast } from './components/ui/Toast';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

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

  const handleLogout = () => {
    localStorage.removeItem('sujalAuth');
    window.location.reload();
  };

  const handleNavigate = (tab) => {
    setActiveTab(tab);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-2xl font-bold">A</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Anam Store</h1>
            <p className="text-gray-500 mt-1">कृपया PIN प्रविष्ट गर्नुहोस्</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-center mb-6">
              <div className="text-2xl tracking-wider font-mono">
                {'●'.repeat(pin.length)}{'○'.repeat(4 - pin.length)}
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  onClick={() => pin.length < 4 && setPin(prev => prev + num)}
                  className="h-16 text-2xl font-semibold bg-gray-50 hover:bg-gray-100 rounded-xl transition active:scale-95"
                >
                  {num}
                </button>
              ))}
              <button
                onClick={() => setPin(prev => prev.slice(0, -1))}
                className="h-16 text-xl font-semibold bg-gray-50 hover:bg-gray-100 rounded-xl transition active:scale-95"
              >
                ⌫
              </button>
              <button
                onClick={() => pin.length < 4 && setPin(prev => prev + '0')}
                className="h-16 text-2xl font-semibold bg-gray-50 hover:bg-gray-100 rounded-xl transition active:scale-95"
              >
                0
              </button>
              <button
                onClick={handlePinSubmit}
                className="h-16 text-xl font-semibold bg-primary-600 hover:bg-primary-700 text-white rounded-xl transition active:scale-95"
              >
                ✅
              </button>
            </div>
            
            {error && <p className="text-red-500 text-center text-sm">{error}</p>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      <MainLayout activeTab={activeTab} onTabChange={setActiveTab} onLogout={handleLogout}>
        {activeTab === 'dashboard' && <Dashboard showToast={showToast} onNavigate={handleNavigate} />}
        {activeTab === 'exchange' && <Exchange showToast={showToast} />}
        {activeTab === 'newcustomer' && <NewCustomer showToast={showToast} />}
        {activeTab === 'customers' && <CustomerHistory showToast={showToast} />}
        {activeTab === 'queue' && <Queue showToast={showToast} onSelectCustomerFromQueue={(item) => {
          // Handle queue selection
          setActiveTab('exchange');
        }} />}
        {activeTab === 'dealer' && <DealerRefill showToast={showToast} />}
        {activeTab === 'refillhistory' && <RefillHistory />}
        {activeTab === 'stock' && <StockSummary />}
      </MainLayout>
    </>
  );
}

export default App;