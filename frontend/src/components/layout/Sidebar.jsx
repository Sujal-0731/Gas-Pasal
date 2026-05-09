import React, { useState, useEffect } from 'react';
import { 
  IconDashboard, 
  IconTransaction, 
  IconCustomers, 
  IconNewCustomer,
  IconQueue, 
  IconDealer, 
  IconStock,
  IconLogout 
} from '../icons';

const navigation = [
  { id: 'dashboard', name: 'ड्यासबोर्ड', nameEn: 'Dashboard', icon: IconDashboard },
  { id: 'exchange', name: 'लेनदेन', nameEn: 'Transactions', icon: IconTransaction},
  { id: 'customers', name: 'ग्राहक सूची', nameEn: 'Customer List', icon: IconCustomers },
  { id: 'newcustomer', name: 'नयाँ ग्राहक', nameEn: 'New Customer', icon: IconNewCustomer },
  { id: 'queue', name: 'पर्खने सूची', nameEn: 'Queue', icon: IconQueue },
  { id: 'dealer', name: 'डिलर रिफिल', nameEn: 'Dealer Refill', icon: IconDealer },
  {id: 'refillhistory', name: 'रिफिल इतिहास', nameEn: 'Refill History', icon: IconTransaction },
  { id: 'stock', name: 'स्टक', nameEn: 'Stock', icon: IconStock },
];

export function Sidebar({ activeTab, onTabChange, onLogout }) {
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

  return (
    <>
      {/* Mobile: Fixed hamburger button */}
      {isMobile && (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="fixed top-4 left-4 z-50 p-2.5 bg-white rounded-lg shadow-md border border-gray-200"
          aria-label="Menu"
        >
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}

      {/* Overlay */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        bg-white border-r border-gray-200 
        flex flex-col 
        transition-transform duration-300 ease-in-out
        fixed top-0 left-0 h-full z-50
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 md:relative
        w-72
        shadow-xl md:shadow-none
      `}>
        {/* Sidebar Header */}
        <div className="h-20 flex items-center px-5 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-lg font-bold">A</span>
            </div>
            <span className="font-semibold text-gray-900 text-lg">Anam Store</span>
          </div>
          
          {/* Close button inside sidebar (mobile only) */}
          {isMobile && (
            <button
              onClick={() => setIsOpen(false)}
              className="ml-auto p-2 rounded-lg text-gray-500 hover:bg-gray-100"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-3 space-y-1.5 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={`
                  w-full flex items-center gap-3 px-4 py-3.5 rounded-xl
                  transition-all duration-200 group
                  ${isActive 
                    ? 'bg-blue-50 text-blue-700' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }
                `}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'}`} />
                <div className="flex-1 text-left">
                  <span className="text-base font-medium">{item.name}</span>
                  <span className="text-xs text-gray-400 block mt-0.5">{item.nameEn}</span>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Footer - Logout */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
          >
            <IconLogout className="w-5 h-5" />
            <span className="text-base font-medium">लगआउट</span>
          </button>
        </div>
      </aside>
    </>
  );
}