import React, { useState, useEffect } from 'react';
import { 
  IconRefresh, 
  IconAlertCircle,
  IconLokpriya,
  IconSugam,
  IconEverest,
  IconOther,
  IconFilledCylinder,
  IconEmptyCylinder
} from '../components/icons';

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
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
        <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-gray-500 text-base">स्टक जानकारी लोड हुँदै...</p>
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

  const filledPercent = total > 0 ? (totalFilled / total) * 100 : 0;
  const emptyPercent = 100 - filledPercent;

  const getCylinderIcon = (name) => {
    if (name === 'लोकप्रिय') return <IconLokpriya />;
    if (name === 'सुगम') return <IconSugam />;
    if (name === 'एभरेस्ट') return <IconEverest />;
    return <IconOther />;
  };

  const cylinderTypes = [
    { key: 'lok', name: 'लोकप्रिय', filled: lok.filled, empty: lok.empty, total: lok.filled + lok.empty, icon: getCylinderIcon('लोकप्रिय') },
    { key: 'sug', name: 'सुगम', filled: sug.filled, empty: sug.empty, total: sug.filled + sug.empty, icon: getCylinderIcon('सुगम') },
    { key: 'eve', name: 'एभरेस्ट', filled: eve.filled, empty: eve.empty, total: eve.filled + eve.empty, icon: getCylinderIcon('एभरेस्ट') },
    { key: 'other', name: 'अन्य', filled: other.filled, empty: other.empty, total: other.filled + other.empty, icon: getCylinderIcon('अन्य') }
  ];

  const getCylinderFilledPercent = (filled, total) => {
    if (total === 0) return 0;
    return (filled / total) * 100;
  };

  return (
    <div className="space-y-5">
      {/* Header Section */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">स्टक व्यवस्थापन</h1>
        <p className="text-base text-gray-500 mt-1">हालको स्टक अवस्था</p>
      </div>

      {/* Total Stock Card - Dual Color Progress Bar (GREEN for Filled, RED for Empty) */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 shadow-sm border border-blue-100">
        <div className="flex justify-between items-center mb-4">
          <span className="text-xl font-bold text-gray-800">📊 कुल स्टक</span>
          <span className="text-4xl font-bold text-blue-700">{total}</span>
        </div>
        
        {/* Dual Color Progress Bar - GREEN + RED */}
        <div className="flex h-5 rounded-full overflow-hidden mb-4 shadow-inner">
          <div 
            className="bg-green-500 h-full transition-all duration-500 flex items-center justify-end pr-2 text-white text-xs font-bold"
            style={{ width: `${filledPercent}%` }}
          >
            {totalFilled > 0 && totalFilled}
          </div>
          <div 
            className="bg-red-500 h-full transition-all duration-500 flex items-center justify-start pl-2 text-white text-xs font-bold"
            style={{ width: `${emptyPercent}%` }}
          >
            {totalEmpty > 0 && totalEmpty}
          </div>
        </div>
        
        {/* Stats Row */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <IconFilledCylinder className="w-5 h-5 text-green-600" />
              <span className="text-gray-700">भरिएको</span>
            </div>
            <span className="text-2xl font-bold text-green-700">{totalFilled}</span>
          </div>
          <div className="w-px h-8 bg-gray-300" />
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <IconEmptyCylinder className="w-5 h-5 text-red-500" />
              <span className="text-gray-700">खाली</span>
            </div>
            <span className="text-2xl font-bold text-red-600">{totalEmpty}</span>
          </div>
        </div>
      </div>

      {/* Cylinder Cards */}
      <div className="space-y-4">
        {cylinderTypes.map((cyl) => {
          const filledPercent = getCylinderFilledPercent(cyl.filled, cyl.total);
          const isLowStock = cyl.filled > 0 && cyl.filled < 5;
          const isOutOfStock = cyl.filled === 0 && cyl.total > 0;
          
          return (
            <div key={cyl.key} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              {/* Cylinder Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    {cyl.icon}
                  </div>
                  <span className="text-lg font-semibold text-gray-800">{cyl.name}</span>
                </div>
                <div className="text-base text-gray-500">
                  जम्मा: <span className="font-semibold text-gray-700">{cyl.total}</span>
                </div>
              </div>

              {/* Filled & Empty Stats Row */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-green-50 rounded-xl p-3 text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <IconFilledCylinder className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-700">भरिएको</span>
                  </div>
                  <div className="text-2xl font-bold text-green-700">{cyl.filled}</div>
                </div>
                <div className="bg-red-50 rounded-xl p-3 text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <IconEmptyCylinder className="w-4 h-4 text-red-500" />
                    <span className="text-sm text-red-600">खाली</span>
                  </div>
                  <div className="text-2xl font-bold text-red-600">{cyl.empty}</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-3">
                <div className="flex h-3 rounded-full overflow-hidden">
                  <div 
                    className="bg-green-500 h-full transition-all duration-500"
                    style={{ width: `${filledPercent}%` }}
                  />
                  <div 
                    className="bg-red-400 h-full transition-all duration-500"
                    style={{ width: `${100 - filledPercent}%` }}
                  />
                </div>
                <div className="flex justify-between text-sm text-gray-500 mt-2">
                  <span>{Math.round(filledPercent)}% भरिएको</span>
                  <span>{Math.round(100 - filledPercent)}% खाली</span>
                </div>
              </div>

              {/* Status Badges */}
              <div className="flex flex-wrap gap-2">
                {isLowStock && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-700 text-sm rounded-full">
                    <IconAlertCircle className="w-4 h-4" />
                    कम स्टक
                  </span>
                )}
                {isOutOfStock && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 text-sm rounded-full">
                    <IconAlertCircle className="w-4 h-4" />
                    स्टक सकियो
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Refresh Button */}
      <button
        onClick={loadStock}
        className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl text-base font-medium transition-colors flex items-center justify-center gap-2 min-h-[48px]"
      >
        <IconRefresh className="w-5 h-5" />
        ताजा गर्नुहोस्
      </button>
    </div>
  );
}

export default StockSummary;