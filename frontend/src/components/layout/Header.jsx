import React, { useState } from 'react';
import { IconUsers, IconLogout } from '../icons';

export function Header({ user, onLogout }) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200 py-3 md:py-4 px-4 shadow-md">
      <div className="flex items-center justify-between">
        {/* Left side - empty spacer for balance */}
        <div className="w-24"></div>

        {/* Center - Store Logo and Name */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
            <span className="text-white text-sm font-bold">A</span>
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-bold text-gray-900">Anam Store</h1>
          </div>
        </div>

        {/* Right side - User Section */}
        {user && (
          <div className="relative w-24 flex justify-end">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <IconUsers className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-sm font-semibold text-gray-800">{user.username}</p>
                <p className="text-xs text-gray-500">{user.role}</p>
              </div>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {showUserMenu && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowUserMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 z-20">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-800">{user.username}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      रोल: {user.role}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      onLogout();
                    }}
                    className="w-full px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50 rounded-b-lg transition-colors flex items-center gap-2"
                  >
                    <IconLogout className="w-4 h-4" />
                    लगआउट गर्नुहोस्
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}