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
      console.error('Error loading stock:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadStock();
  }, []);

  if (loading && !stock) {
    return (
      <div className="bg-white rounded-2xl p-5 shadow-md text-center">
        <div className="py-8 text-gray-500">⏳ स्टक जानकारी लोड हुँदै...</div>
      </div>
    );
  }

  const lok = stock?.['लोकप्रिय'] || { filled: 0, empty: 0 };
  const sug = stock?.['सुगम'] || { filled: 0, empty: 0 };
  const eve = stock?.['एभरेस्ट'] || { filled: 0, empty: 0 };
  const other = stock?.['अन्य / Other'] || { filled: 0, empty: 0 };
  
  const totalFilled = lok.filled + sug.filled + eve.filled + other.filled;
  const totalEmpty = lok.empty + sug.empty + eve.empty + other.empty;
  const total = totalFilled + totalEmpty;

  // Helper function to get color based on stock level
  const getStockColor = (count, type) => {
    if (type === 'filled') {
      if (count === 0) return 'text-red-600';
      if (count < 5) return 'text-orange-500';
      return 'text-green-600';
    } else {
      if (count === 0) return 'text-gray-400';
      return 'text-blue-600';
    }
  };

  // Helper function to get progress bar width
  const getProgressWidth = (count, total) => {
    if (total === 0) return '0%';
    return `${(count / total) * 100}%`;
  };

  const cylinderTypes = [
    { key: 'lok', name: 'लोकप्रिय', icon: '🟦', color: 'blue', filled: lok.filled, empty: lok.empty, total: lok.filled + lok.empty },
    { key: 'sug', name: 'सुगम', icon: '🟩', color: 'green', filled: sug.filled, empty: sug.empty, total: sug.filled + sug.empty },
    { key: 'eve', name: 'एभरेस्ट', icon: '🟧', color: 'orange', filled: eve.filled, empty: eve.empty, total: eve.filled + eve.empty },
    { key: 'other', name: 'अन्य', icon: '🟪', color: 'purple', filled: other.filled, empty: other.empty, total: other.filled + other.empty }
  ];

  return (
    <div className="bg-white rounded-2xl p-5 shadow-md">
      <h2 className="text-xl font-bold text-blue-900 border-l-4 border-orange-500 pl-3 mb-4">
        📦 हालको स्टक / Current Stock
      </h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-green-50 rounded-xl p-3 text-center border border-green-200">
          <div className="text-2xl mb-1">📥</div>
          <div className="text-2xl font-bold text-green-700">{totalFilled}</div>
          <div className="text-xs text-green-600">भरिएको / Filled</div>
        </div>
        <div className="bg-blue-50 rounded-xl p-3 text-center border border-blue-200">
          <div className="text-2xl mb-1">📤</div>
          <div className="text-2xl font-bold text-blue-700">{totalEmpty}</div>
          <div className="text-xs text-blue-600">खाली / Empty</div>
        </div>
      </div>

      {/* Cylinder wise stock */}
      <div className="space-y-4">
        {cylinderTypes.map(cyl => (
          <div key={cyl.key} className="bg-gray-50 rounded-xl p-3">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">{cyl.icon}</span>
                <span className="font-bold text-gray-800">{cyl.name}</span>
              </div>
              <div className="text-sm text-gray-500">
                जम्मा: {cyl.total}
              </div>
            </div>
            
            {/* Filled Stock Bar */}
            <div className="mb-2">
              <div className="flex justify-between text-xs mb-1">
                <span className="flex items-center gap-1">
                  <span className="text-green-600">📥</span> भरिएको
                </span>
                <span className={`font-bold ${getStockColor(cyl.filled, 'filled')}`}>
                  {cyl.filled}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: getProgressWidth(cyl.filled, cyl.total) }}
                ></div>
              </div>
            </div>
            
            {/* Empty Stock Bar */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="flex items-center gap-1">
                  <span className="text-blue-600">📤</span> खाली
                </span>
                <span className={`font-bold ${getStockColor(cyl.empty, 'empty')}`}>
                  {cyl.empty}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: getProgressWidth(cyl.empty, cyl.total) }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Total Stock Bar */}
      <div className="mt-5 bg-indigo-50 rounded-xl p-4">
        <div className="flex justify-between items-center mb-2">
          <span className="font-bold text-gray-800">📊 कुल स्टक / Total Stock</span>
          <span className="font-bold text-indigo-700">{total}</span>
        </div>
        <div className="flex h-3 rounded-full overflow-hidden">
          <div 
            className="bg-green-500 h-full transition-all duration-300"
            style={{ width: `${(totalFilled / total) * 100}%` }}
            title={`भरिएको: ${totalFilled}`}
          ></div>
          <div 
            className="bg-blue-500 h-full transition-all duration-300"
            style={{ width: `${(totalEmpty / total) * 100}%` }}
            title={`खाली: ${totalEmpty}`}
          ></div>
        </div>
        <div className="flex justify-center gap-4 mt-2 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>भरिएको {totalFilled}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span>खाली {totalEmpty}</span>
          </div>
        </div>
      </div>

      {/* Warning for low stock */}
      {cylinderTypes.some(cyl => cyl.filled > 0 && cyl.filled < 5) && (
        <div className="mt-4 bg-orange-50 border border-orange-200 rounded-xl p-3">
          <div className="flex items-center gap-2 text-orange-700">
            <span>⚠️</span>
            <span className="text-sm font-medium">कम स्टक चेतावनी / Low Stock Alert</span>
          </div>
          <div className="text-xs text-orange-600 mt-1">
            {cylinderTypes.filter(cyl => cyl.filled > 0 && cyl.filled < 5).map(cyl => (
              <span key={cyl.key} className="inline-block mr-3">
                {cyl.icon} {cyl.name}: {cyl.filled} मात्र बाँकी
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Out of stock warning */}
      {cylinderTypes.some(cyl => cyl.filled === 0 && cyl.total > 0) && (
        <div className="mt-3 bg-red-50 border border-red-200 rounded-xl p-3">
          <div className="flex items-center gap-2 text-red-700">
            <span>🚨</span>
            <span className="text-sm font-medium">स्टक सकियो / Out of Stock</span>
          </div>
          <div className="text-xs text-red-600 mt-1">
            {cylinderTypes.filter(cyl => cyl.filled === 0 && cyl.total > 0).map(cyl => (
              <span key={cyl.key} className="inline-block mr-3">
                {cyl.icon} {cyl.name}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="text-xs text-gray-400 text-center mt-4 pt-2 border-t">
        💡 "कोही छैन" ले फिल्ड घटाउँदैन वा खाली बढाउँदैन
      </div>

      <button
        onClick={loadStock}
        className="w-full bg-blue-900 text-white py-3 rounded-full font-semibold mt-4 hover:bg-blue-800 transition"
      >
        🔄 ताजा गर्नुहोस् / Refresh
      </button>
    </div>
  );
}

export default StockSummary;