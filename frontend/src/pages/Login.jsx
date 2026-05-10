import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { t } from '../utils/translations';
import { IconLanguage } from '../components/icons';

const API_URL = import.meta.env.VITE_API_URL;

function Login({ onLogin, showToast }) {
  const { language, toggleLanguage } = useLanguage();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!username || !password) {
      showToast(t('usernamePasswordRequired', language), 'error');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      const data = await response.json();
      
      if (data.success) {
        localStorage.setItem('auth_token', data.data.token);
        localStorage.setItem('user', JSON.stringify(data.data.user));
        
        showToast(`${t('welcome', language)}, ${data.data.user.username}!`, 'success');
        onLogin(data.data.user);
      } else {
        showToast(data.message || t('loginFailed', language), 'error');
      }
    } catch (error) {
      console.error('Login error:', error);
      showToast(t('networkError', language), 'error');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-700 to-blue-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md relative">
        {/* Language Toggle Button - Top Right */}
        <button
          onClick={toggleLanguage}
          className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-gray-100 hover:bg-gray-200 rounded-lg transition"
          aria-label={language === 'np' ? 'Switch to English' : 'नेपालीमा स्विच गर्नुहोस्'}
        >
          <IconLanguage className="w-4 h-4" />
          <span className="font-semibold">{language === 'np' ? 'EN' : 'NP'}</span>
        </button>

        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-blue-600 text-2xl font-bold">A</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Anam Store</h2>
          <p className="text-gray-500 mt-1">{t('appDescription', language)}</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('username', language)}
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
              placeholder={t('enterUsername', language)}
              disabled={loading}
              autoFocus
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('password', language)}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
              placeholder={t('enterPassword', language)}
              disabled={loading}
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold transition disabled:opacity-50"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {t('loggingIn', language)}
              </div>
            ) : (
              t('login', language)
            )}
          </button>
        </form>
        
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>{t('contactAdmin', language)}</p>
        </div>
      </div>
    </div>
  );
}

export default Login;