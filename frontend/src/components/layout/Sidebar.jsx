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

export function Sidebar({ open, onClose, activeTab, onTabChange, onLogout, user }) {
  const { language } = useLanguage();

  const handleTabChange = (tabId) => {
    onTabChange(tabId);
    onClose();
  };

  const handleLogout = () => {
    onLogout();
    onClose();
  };

  const isAdmin = user?.role === 'admin';
  const navigation = [...baseNavigation, ...(isAdmin ? adminNavigation : [])];

  return (
    <>
      {/* Backdrop (mobile only) */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64
          bg-white border-r border-gray-200 flex flex-col
          transition-transform duration-200 ease-in-out
          ${open ? 'translate-x-0 shadow-xl' : '-translate-x-full'}
          md:static md:translate-x-0 md:shadow-none
        `}
      >
        {/* Sidebar Header */}
        <div className="h-16 md:h-20 flex items-center px-5 border-b border-gray-200 shrink-0">
          <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
            <span className="text-white text-base font-bold">A</span>
          </div>
          <div className="ml-3 min-w-0">
            <span className="font-bold text-gray-900 text-base md:text-lg block truncate">Anam Store</span>
            <span className="text-xs text-gray-500 truncate block">Gas Cylinder Management</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const displayName = t(item.name, language);

            return (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`
                  w-full flex items-center gap-3 px-3 py-3 rounded-lg
                  transition-colors
                  ${isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }
                `}
              >
                <Icon
                  className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-gray-400'}`}
                />
                <span className={`text-sm font-medium truncate ${isActive ? 'text-white' : 'text-gray-700'}`}>
                  {displayName}
                </span>
              </button>
            );
          })}
        </nav>

        {/* User Info Section */}
        {user && (
          <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 shrink-0">
            <div className="flex items-center gap-3 px-1 py-1">
              <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center shrink-0">
                <span className="text-white text-sm font-bold uppercase">
                  {user.username?.charAt(0) || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{user.username}</p>
                <p className="text-xs text-gray-500">
                  {user.role === 'admin' ? t('admin', language) : t('mom', language)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Footer - Logout */}
        <div className="p-3 border-t border-gray-200 shrink-0">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <IconLogout className="w-5 h-5 shrink-0" />
            <span className="text-sm font-medium">{t('logout', language)}</span>
          </button>
        </div>
      </aside>
    </>
  );
}
