import React from 'react';
import { IconDashboard, IconUsers, IconTransactions, IconQueue, IconStock } from '../icons';

export function MobileNav({ activeTab, onTabChange }) {
  const navItems = [
    { id: 'dashboard', label: 'ड्यासबोर्ड', icon: IconDashboard },
    { id: 'exchange', label: 'लेनदेन', icon: IconTransactions },
    { id: 'customers', label: 'ग्राहक', icon: IconUsers },
    { id: 'queue', label: 'क्यू', icon: IconQueue },
    { id: 'stock', label: 'स्टक', icon: IconStock },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center py-2 px-4 z-50">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        
        return (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg transition ${
              isActive ? 'text-blue-600' : 'text-gray-500'
            }`}
          >
            <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
            <span className={`text-xs ${isActive ? 'font-medium' : ''}`}>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}