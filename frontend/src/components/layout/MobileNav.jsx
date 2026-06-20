import React from 'react';
import { 
  IconDashboard, 
  IconUsers, 
  IconTransaction, 
  IconQueue, 
  IconStock, 
  IconSettings 
} from '../icons';
import { useLanguage } from '../../context/LanguageContext';
import { t } from '../../utils/translations';

export function MobileNav({ activeTab, onTabChange, user }) {
  const { language } = useLanguage();
  const isAdmin = user?.role === 'admin';
  
  // Base navigation for all users
  const baseNavItems = [
    { id: 'dashboard', translationKey: 'dashboard', icon: IconDashboard },
    { id: 'exchange', translationKey: 'transactions', icon: IconTransaction },
    { id: 'customers', translationKey: 'customers', icon: IconUsers },
    { id: 'queue', translationKey: 'queue', icon: IconQueue },
    { id: 'stock', translationKey: 'stock', icon: IconStock },
  ];
  
  // Admin only navigation
  const adminNavItems = [
    { id: 'admin', translationKey: 'adminPanel', icon: IconSettings },
  ];
  
  // Combine navigation based on user role
  const navItems = [...baseNavItems, ...(isAdmin ? adminNavItems : [])];

  // Get translated label
  const getTranslatedLabel = (translationKey) => {
    return t(translationKey, language);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center py-1 px-1 z-50 shadow-lg">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        const label = getTranslatedLabel(item.translationKey);
        
        // Shorten label for English
        const displayLabel = language === 'en' 
          ? (label.length > 10 ? label.substring(0, 8) + '...' : label)
          : label;
        
        return (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`
              flex flex-col items-center justify-center gap-0.5 py-1.5 px-1.5 rounded-lg 
              transition-all duration-200 min-w-[44px] flex-1
              ${isActive 
                ? 'text-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
              }
            `}
          >
            <Icon className={`
              w-5 h-5 transition-all duration-200
              ${isActive ? 'text-blue-600' : 'text-gray-400'}
            `} />
            <span className={`
              text-[10px] leading-tight text-center transition-all duration-200 max-w-full
              ${isActive ? 'font-semibold text-blue-600' : 'text-gray-500'}
            `}>
              {displayLabel}
            </span>
            {isActive && (
              <div className="w-1 h-1 bg-blue-600 rounded-full mt-0.5" />
            )}
          </button>
        );
      })}
    </div>
  );
}