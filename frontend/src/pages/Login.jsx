import React, { useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL;

function Login({ onLogin, showToast }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!username || !password) {
      showToast('यूजरनेम र पासवर्ड आवश्यक छ', 'error');
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
        // Store token and user info
        localStorage.setItem('auth_token', data.data.token);
        localStorage.setItem('user', JSON.stringify(data.data.user));
        
        showToast(`स्वागत छ, ${data.data.user.username}!`, 'success');
        onLogin(data.data.user);
      } else {
        showToast(data.message || 'लगइन असफल', 'error');
      }
    } catch (error) {
      console.error('Login error:', error);
      showToast('इन्टरनेट जडान जाँच गर्नुहोस्', 'error');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-700 to-blue-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-blue-600 text-2xl font-bold">A</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Anam Store</h2>
          <p className="text-gray-500 mt-1">ग्यास सिलिन्डर व्यवस्थापन प्रणाली</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              यूजरनेम
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
              placeholder="आफ्नो यूजरनेम लेख्नुहोस्"
              disabled={loading}
              autoFocus
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              पासवर्ड
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
              placeholder="पासवर्ड लेख्नुहोस्"
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
                लगइन हुँदै...
              </div>
            ) : (
              'लगइन गर्नुहोस्'
            )}
          </button>
        </form>
        
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>सम्पर्क: प्रणाली व्यवस्थापक</p>
        </div>
      </div>
    </div>
  );
}

export default Login;