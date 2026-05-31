import { useState, useEffect } from 'react';
import { 
  IconDashboard, 
  IconTransaction, 
  IconCustomers, 
  IconNewCustomer,
  IconQueue, 
  IconDealer, 
  IconStock,
  IconLogout,
  IconSettings,
  IconChevronLeft,
  IconList
} from '../icons';
import { useLanguage } from '../../context/LanguageContext';
import { t } from '../../utils/translations';

// Base navigation for all users
const baseNavigation = [
  { id: 'dashboard', name: 'dashboard', nameEn: 'Dashboard', icon: IconDashboard },
  { id: 'exchange', name: 'transactions', nameEn: 'Exchange', icon: IconTransaction },
  { id: 'transactions', name: 'allTransactions', nameEn: 'All Transactions', icon: IconList }, 
  { id: 'customers', name: 'customers', nameEn: 'Customer List', icon: IconCustomers },
  { id: 'newcustomer', name: 'newCustomer', nameEn: 'New Customer', icon: IconNewCustomer },
  { id: 'queue', name: 'queue', nameEn: 'Queue', icon: IconQueue },
  { id: 'dealer', name: 'dealerRefill', nameEn: 'Dealer Refill', icon: IconDealer },
  { id: 'refillhistory', name: 'refillHistory', nameEn: 'Refill History', icon: IconTransaction },
  { id: 'stock', name: 'stock', nameEn: 'Stock', icon: IconStock },
];

// Admin only navigation
const adminNavigation = [
  { id: 'admin', name: 'adminPanel', nameEn: 'Admin Panel', icon: IconSettings },
];

export function Sidebar({ activeTab, onTabChange, onLogout, user }) {
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setIsOpen(true);
      } else {
        setIsOpen(false);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleTabChange = (tabId) => {
    onTabChange(tabId);
    if (isMobile) {
      setIsOpen(false);
    }
  };

  const handleLogout = () => {
    onLogout();
    if (isMobile) {
      setIsOpen(false);
    }
  };

  const isAdmin = user?.role === 'admin';
  const navigation = [...baseNavigation, ...(isAdmin ? adminNavigation : [])];

  // Get translated name
  const getTranslatedName = (item) => {
    return t(item.name, language);
  };

  return (
    <>
      {/* Mobile: Fixed hamburger button */}
      {isMobile && (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="fixed top-4 left-4 z-50 p-3 bg-white rounded-xl shadow-lg border border-gray-200 hover:bg-gray-50 transition-all duration-200"
          aria-label="Menu"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}

      {/* Overlay */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        bg-white border-r border-gray-200 
        flex flex-col 
        transition-transform duration-300 ease-in-out
        fixed top-0 left-0 h-full z-50
        ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
        md:translate-x-0 md:relative md:shadow-md
        w-80
      `}>
        {/* Sidebar Header */}
        <div className="h-20 flex items-center px-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-md">
              <span className="text-white text-lg font-bold">A</span>
            </div>
            <div>
              <span className="font-bold text-gray-900 text-lg block">Anam Store</span>
              <span className="text-xs text-gray-500">Gas Cylinder Management</span>
            </div>
          </div>
          
          {isMobile && (
            <button
              onClick={() => setIsOpen(false)}
              className="ml-auto p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-all duration-200"
              aria-label="Close"
            >
              <IconChevronLeft className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const displayName = getTranslatedName(item);
            
            return (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={`
                  w-full flex items-center gap-3 px-4 py-3.5 rounded-xl
                  transition-all duration-200 group
                  ${isActive 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }
                `}
              >
                <Icon className={`
                  w-5 h-5 transition-all duration-200
                  ${isActive 
                    ? 'text-white' 
                    : 'text-gray-400 group-hover:text-gray-500'
                  }
                `} />
                <div className="flex-1 text-left">
                  <span className={`
                    text-sm font-medium transition-all duration-200
                    ${isActive ? 'text-white' : 'text-gray-700'}
                  `}>
                    {displayName}
                  </span>
                  <span className={`
                    text-xs block mt-0.5 transition-all duration-200
                    ${isActive ? 'text-blue-100' : 'text-gray-400'}
                  `}>
                    {item.nameEn}
                  </span>
                </div>
                {isActive && (
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                )}
              </button>
            );
          })}
        </nav>

        {/* User Info Section */}
        {user && (
          <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
            <div className="flex items-center gap-3 px-2 py-2 rounded-xl">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-sm">
                <span className="text-white text-sm font-bold uppercase">
                  {user.username?.charAt(0) || 'U'}
                </span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-800">{user.username}</p>
                <p className="text-xs text-gray-500">
                  {user.role === 'admin' ? t('admin', language) : t('mom', language)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Footer - Logout */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all duration-200 group"
          >
            <IconLogout className="w-5 h-5 transition-colors duration-200 group-hover:text-red-600" />
            <span className="text-sm font-medium transition-colors duration-200">
              {t('logout', language)}
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}