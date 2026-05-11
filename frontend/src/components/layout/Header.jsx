import React, { useState } from 'react';
import { IconUsers, IconLogout, IconLanguage } from '../icons';
import { useLanguage } from '../../context/LanguageContext';

const API_URL = import.meta.env.VITE_API_URL;

export function Header({ user, onLogout }) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { language, toggleLanguage } = useLanguage();

  const handleLogout = async () => {
    setIsLoggingOut(true);
    
    // Silently try to logout - don't await, don't check response
    fetch(`${API_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include'
    }).catch(() => {
      // Completely ignore any errors
    });
    
    // Always logout locally immediately
    onLogout();
    setIsLoggingOut(false);
    setShowUserMenu(false);
  };
  
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200 py-3 px-4 shadow-md">
      <div className="flex items-center justify-between">
        {/* Left side - Empty spacer to balance on desktop */}
        <div className="w-20 md:w-24"></div>

        {/* Center - Store Name */}
        <div className="flex items-center justify-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-white text-sm font-bold">A</span>
            </div>
            <div>
              <h1 className="text-base md:text-xl font-bold text-gray-900">Anam Store</h1>
              <p className="text-xs text-gray-500 hidden sm:block">लोकप्रिय · सुगम · एभरेस्ट</p>
            </div>
          </div>
        </div>

        {/* Right side - Language + User Menu */}
        <div className="flex items-center gap-2">
          {/* Language Toggle */}
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-2 py-1.5 md:px-3 md:py-2 text-xs md:text-sm font-medium bg-gray-100 hover:bg-gray-200 rounded-lg transition"
          >
            <IconLanguage className="w-3.5 h-3.5 md:w-4 md:h-4" />
            <span className="font-semibold">{language === 'np' ? 'EN' : 'NP'}</span>
          </button>
          
          {user && (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="w-7 h-7 md:w-8 md:h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <IconUsers className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-600" />
                </div>
                <span className="text-sm font-medium hidden sm:block">{user.username}</span>
                <svg className="w-3 h-3 md:w-4 md:h-4 text-gray-400 hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

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
                        {user.role === 'admin' ? 'प्रशासक' : 'सञ्चालक'}
                      </p>
                    </div>
                    <button
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      className="w-full px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50 rounded-b-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                      <IconLogout className="w-4 h-4" />
                      {isLoggingOut ? 'लगआउट हुदै...' : 'लगआउट'}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}