import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { t } from '../../utils/translations';
import { IconLokpriya, IconSugam, IconEverest, IconOther } from '../icons';

export function StockProgress({ stock }) {
  const { language } = useLanguage();
  
  // ✅ Add null check - if stock is null or undefined, show loading or empty state
  if (!stock) {
    return (
      <div className="text-center text-gray-400 text-base py-4">
        {t('loading', language)}...
      </div>
    );
  }
  
  // Define the mapping between display names and actual stock keys
  const stockMapping = [
    { 
      displayName: t('lokpriya', language),
      stockKey: 'लोकप्रिय',
      icon: IconLokpriya
    },
    { 
      displayName: t('sugam', language),
      stockKey: 'सुगम',
      icon: IconSugam
    },
    { 
      displayName: t('everest', language),
      stockKey: 'एभरेस्ट',
      icon: IconEverest
    },
    { 
      displayName: t('other', language),
      stockKey: 'अन्य / Other',
      icon: IconOther
    }
  ];
  
  const getLogo = (stockKey) => {
    const mapping = stockMapping.find(m => m.stockKey === stockKey);
    if (mapping) {
      const Icon = mapping.icon;
      return <Icon />;
    }
    return <IconOther />;
  };

  const stockItems = stockMapping
    .filter(mapping => stock[mapping.stockKey])  // ✅ Now stock is guaranteed to exist
    .map(mapping => ({
      displayName: mapping.displayName,
      stockKey: mapping.stockKey,
      filled: stock[mapping.stockKey]?.filled || 0,
      empty: stock[mapping.stockKey]?.empty || 0,
      total: (stock[mapping.stockKey]?.filled || 0) + (stock[mapping.stockKey]?.empty || 0),
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

  if (stockItems.length === 0) {
    return (
      <div className="text-center text-gray-400 text-base py-4">
        {t('noData', language)}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {stockItems.map((item) => {
        const filledPercent = getFilledPercent(item.filled, item.total);
        const emptyPercent = 100 - filledPercent;
        const filledColor = getFilledColor(item.filled, item.total);
        
        return (
          <div key={item.stockKey} className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                {getLogo(item.stockKey)}
                <span className="text-base font-medium text-gray-700">{item.displayName}</span>
              </div>
              <div className="flex gap-4 text-sm">
                <span className="text-green-600 font-medium">
                  {t('filled', language)}: {item.filled}
                </span>
                <span className="text-red-500 font-medium">
                  {t('empty', language)}: {item.empty}
                </span>
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
              <span>{Math.round(filledPercent)}% {t('filled', language)}</span>
              <span>{Math.round(emptyPercent)}% {t('empty', language)}</span>
            </div>
          </div>
        );
      })}
      
      {stockItems.length > 0 && (
        <div className="mt-5 pt-4 border-t border-gray-200">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-base font-semibold text-gray-700">
                📊 {t('totalStock', language)}
              </span>
              <span className="text-xl font-bold text-gray-900">{grandTotal}</span>
            </div>
            <div className="flex justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-gray-600">{t('filled', language)}: {grandTotalFilled}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                <span className="text-gray-600">{t('empty', language)}: {grandTotalEmpty}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}