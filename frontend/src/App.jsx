// App.jsx - Fixed version
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
import AdminPanel from './pages/AdminPanel';
import Login from './pages/Login';
import { Toast } from './components/ui/Toast';
import { LanguageProvider } from './context/LanguageContext';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [queueCustomer, setQueueCustomer] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    // Check for existing token
    const token = localStorage.getItem('auth_token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      const userData = JSON.parse(savedUser);
      setUser(userData);
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData) => {
    setIsAuthenticated(true);
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
    setActiveTab('dashboard');
    setQueueCustomer(null);
    showToast('लगआउट भयो', 'success');
  };

  const handleNavigate = (tab) => {
    setActiveTab(tab);
  };

  const handleQueueSelect = (item) => {
    setQueueCustomer(item);
    setActiveTab('exchange');
  };

  const handleClearQueueCustomer = () => {
    setQueueCustomer(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500">लोड हुँदै...</p>
        </div>
      </div>
    );
  }

  // Wrap EVERYTHING in LanguageProvider
  return (
    <LanguageProvider>
      {!isAuthenticated ? (
        <Login onLogin={handleLogin} showToast={showToast} />
      ) : (
        <>
          {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
          
          <MainLayout 
            activeTab={activeTab} 
            onTabChange={setActiveTab} 
            onLogout={handleLogout}
            user={user}
          >
            {activeTab === 'dashboard' && (
              <Dashboard showToast={showToast} onNavigate={handleNavigate} />
            )}
            
            {activeTab === 'exchange' && (
              <Exchange 
                showToast={showToast} 
                queueCustomer={queueCustomer}
                onClearQueueCustomer={handleClearQueueCustomer}
              />
            )}
            
            {activeTab === 'newcustomer' && (
              <NewCustomer showToast={showToast} />
            )}
            
            {activeTab === 'customers' && (
              <CustomerHistory showToast={showToast} user={user} />
            )}
            
            {activeTab === 'queue' && (
              <Queue 
                showToast={showToast} 
                onSelectCustomerFromQueue={handleQueueSelect}
              />
            )}
            
            {activeTab === 'dealer' && (
              <DealerRefill showToast={showToast} />
            )}
            
            {activeTab === 'refillhistory' && (
              <RefillHistory />
            )}
            
            {activeTab === 'stock' && (
              <StockSummary />
            )}
            
            {activeTab === 'admin' && (
              <AdminPanel showToast={showToast} user={user} />
            )}
          </MainLayout>
        </>
      )}
    </LanguageProvider>
  );
}

export default App;