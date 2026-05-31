// App.jsx - Fixed version with better session handling
import { useState, useEffect, useCallback } from 'react';
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
import Transactions from './pages/Transactions';
import { Toast } from './components/ui/Toast';
import { LanguageProvider } from './context/LanguageContext';
import { subscribeAdminToPush } from './utils/pushNotifications';

const API_URL = import.meta.env.VITE_API_URL;

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

  // ✅ Wrap checkAuth with useCallback
  const checkAuth = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        credentials: 'include'
      });
      
      // ✅ Handle rate limiting
      if (response.status === 429) {
        console.log('Rate limited, will retry in 5 seconds');
        setTimeout(checkAuth, 5000);
        return;
      }
      
      const data = await response.json();
      
      if (data.success && data.data?.user) {
        setUser(data.data.user);
        setIsAuthenticated(true);
        console.log('Session restored:', data.data.user.username);
      }
    } catch (error) {
      console.log('No active session');
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ Add checkAuth to dependency array
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const handleLogin = (userData) => {
    setIsAuthenticated(true);
    setUser(userData);
    if (userData.role === 'admin'||userData.role === 'mom') {
      subscribeAdminToPush(userData);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
    
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

  return (
    <LanguageProvider>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      {!isAuthenticated ? (
        <Login onLogin={handleLogin} showToast={showToast} />
      ) : (
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
          {activeTab === 'transactions' && (
            <Transactions showToast={showToast} />
          )}
          {activeTab === 'admin' && (
            <AdminPanel showToast={showToast} user={user} />
          )}
        </MainLayout>
      )}
    </LanguageProvider>
  );
}

export default App;