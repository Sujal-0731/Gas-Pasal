import React from 'react';
import { IconLokpriya, IconSugam, IconEverest, IconOther } from '../icons';

export function StockProgress({ stock }) {
  const stockOrder = ['लोकप्रिय', 'सुगम', 'एभरेस्ट', 'अन्य / Other'];
  
  const getLogo = (type) => {
    if (type.includes('लोकप्रिय')) return <IconLokpriya />;
    if (type.includes('सुगम')) return <IconSugam />;
    if (type.includes('एभरेस्ट')) return <IconEverest />;
    return <IconOther />;
  };

  const stockItems = stockOrder
    .filter(type => stock[type])
    .map(type => ({
      name: type,
      filled: stock[type]?.filled || 0,
      empty: stock[type]?.empty || 0,
      total: (stock[type]?.filled || 0) + (stock[type]?.empty || 0),
    }));

  const grandTotalFilled = stockItems.reduce((sum, item) => sum + item.filled, 0);
  const grandTotalEmpty = stockItems.reduce((sum, item) => sum + item.empty, 0);
  const grandTotal = grandTotalFilled + grandTotalEmpty;

  const getFilledPercent = (filled, total) => total > 0 ? (filled / total) * 100 : 0;

  const getFilledColor = (filled, total) => {
    const percent = getFilledPercent(filled, total);
    if (percent < 30) return 'bg-red-500';
    if (percent < 60) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="space-y-5">
      {stockItems.map((item) => {
        const filledPercent = getFilledPercent(item.filled, item.total);
        const emptyPercent = 100 - filledPercent;
        const filledColor = getFilledColor(item.filled, item.total);
        
        return (
          <div key={item.name} className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                {getLogo(item.name)}
                <span className="text-base font-medium text-gray-700">{item.name}</span>
              </div>
              <div className="flex gap-4 text-sm">
                <span className="text-green-600 font-medium">भरिएको: {item.filled}</span>
                <span className="text-red-500 font-medium">खाली: {item.empty}</span>
              </div>
            </div>
            
            <div className="flex h-3 rounded-full overflow-hidden">
              <div 
                className={`${filledColor} h-full transition-all duration-500`}
                style={{ width: `${filledPercent}%` }}
              />
              <div 
                className="bg-red-400 h-full transition-all duration-500"
                style={{ width: `${emptyPercent}%` }}
              />
            </div>
            
            <div className="flex justify-between text-sm text-gray-400">
              <span>{Math.round(filledPercent)}% भरिएको</span>
              <span>{Math.round(emptyPercent)}% खाली</span>
            </div>
          </div>
        );
      })}
      
      {stockItems.length > 0 && (
        <div className="mt-5 pt-4 border-t border-gray-200">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-base font-semibold text-gray-700">📊 जम्मा स्टक</span>
              <span className="text-xl font-bold text-gray-900">{grandTotal}</span>
            </div>
            <div className="flex justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-gray-600">भरिएको: {grandTotalFilled}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                <span className="text-gray-600">खाली: {grandTotalEmpty}</span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {stockItems.length === 0 && (
        <div className="text-center text-gray-400 text-base py-4">स्टक डाटा छैन</div>
      )}
    </div>
  );
}