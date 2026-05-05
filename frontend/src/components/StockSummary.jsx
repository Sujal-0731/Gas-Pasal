import React, { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL;
const PIN_CODE = import.meta.env.VITE_PIN_CODE;

function StockSummary() {
  const [stock, setStock] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadStock = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/stock`, {
        headers: { 'x-pin': PIN_CODE }
      });
      const data = await res.json();
      if (data.success) {
        setStock(data.stock);
      }
    } catch (error) {
      console.error('Error:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadStock();
  }, []);

  if (loading && !stock) {
    return <div className="bg-white rounded-2xl p-5 text-center">⏳ लोड हुँदै...</div>;
  }

  const lok = stock?.['लोकप्रिय'] || { filled: 0, empty: 0 };
  const sug = stock?.['सुगम'] || { filled: 0, empty: 0 };
  const eve = stock?.['एभरेस्ट'] || { filled: 0, empty: 0 };
  
  const totalFilled = lok.filled + sug.filled + eve.filled;
  const totalEmpty = lok.empty + sug.empty + eve.empty;
  const total = totalFilled + totalEmpty;

  return (
    <div className="bg-white rounded-2xl p-5 shadow-md">
      <h2 className="text-xl font-bold text-blue-900 border-l-4 border-orange-500 pl-3 mb-4">
        📦 हालको स्टक
      </h2>

      <div className="bg-indigo-50 p-4 rounded-xl mb-4">
        <div className="flex justify-between mb-3">
          <strong>🟦 लोकप्रिय</strong>
          <span>भरिएको: {lok.filled} | खाली: {lok.empty} | जम्मा: {lok.filled + lok.empty}</span>
        </div>
        <div className="flex justify-between mb-3">
          <strong>🟩 सुगम</strong>
          <span>भरिएको: {sug.filled} | खाली: {sug.empty} | जम्मा: {sug.filled + sug.empty}</span>
        </div>
        <div className="flex justify-between mb-3">
          <strong>🟧 एभरेस्ट</strong>
          <span>भरिएको: {eve.filled} | खाली: {eve.empty} | जम्मा: {eve.filled + eve.empty}</span>
        </div>
      </div>

      <div className="bg-blue-900 text-white text-center py-3 rounded-full mb-4">
        📊 कुल भरिएको: {totalFilled} | कुल खाली: {totalEmpty} | जम्मा: {total}
      </div>

      <button onClick={loadStock} className="w-full bg-gray-600 text-white py-3 rounded-full">
        🔄 ताजा गर्नुहोस्
      </button>
    </div>
  );
}

export default StockSummary;