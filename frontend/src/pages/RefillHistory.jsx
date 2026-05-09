import React, { useState, useEffect } from 'react';
import { 
  IconSearch, 
  IconRefresh, 
  IconCalendar, 
  IconTrendingUp,
  IconLokpriya,
  IconSugam,
  IconEverest,
  IconFilledCylinder,
  IconEmptyCylinder,
  IconExchange  
} from '../components/icons';

const API_URL = import.meta.env.VITE_API_URL;
const PIN_CODE = import.meta.env.VITE_PIN_CODE;

function RefillHistory() {
  const [refills, setRefills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadRefillHistory();
  }, []);

  const loadRefillHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/refills`, {
        headers: { 'x-pin': PIN_CODE }
      });
      const data = await res.json();
      if (data.success) {
        setRefills(data.refills);
      }
    } catch (error) {
      console.error('Error loading refills:', error);
    }
    setLoading(false);
  };

  // Filter refills by date or notes
  const filteredRefills = refills.filter(r => {
    if (!searchTerm) return true;
    return r.refill_date.includes(searchTerm) || 
           (r.notes && r.notes.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  // Get summary statistics for normal mode
  const totalLokpriyaFilled = refills.reduce((sum, r) => sum + (r.lokpriya_filled || 0), 0);
  const totalLokpriyaEmpty = refills.reduce((sum, r) => sum + (r.lokpriya_empty || 0), 0);
  const totalSugamFilled = refills.reduce((sum, r) => sum + (r.sugam_filled || 0), 0);
  const totalSugamEmpty = refills.reduce((sum, r) => sum + (r.sugam_empty || 0), 0);
  const totalEverestFilled = refills.reduce((sum, r) => sum + (r.everest_filled || 0), 0);
  const totalEverestEmpty = refills.reduce((sum, r) => sum + (r.everest_empty || 0), 0);
  
  // Exchange mode statistics for ALL cylinder types
  const totalExchangeGiveLokpriya = refills.reduce((sum, r) => sum + (r.exchange_give_lokpriya || 0), 0);
  const totalExchangeTakeLokpriya = refills.reduce((sum, r) => sum + (r.exchange_take_lokpriya || 0), 0);
  const totalExchangeGiveSugam = refills.reduce((sum, r) => sum + (r.exchange_give_sugam || 0), 0);
  const totalExchangeTakeSugam = refills.reduce((sum, r) => sum + (r.exchange_take_sugam || 0), 0);
  const totalExchangeGiveEverest = refills.reduce((sum, r) => sum + (r.exchange_give_everest || 0), 0);
  const totalExchangeTakeEverest = refills.reduce((sum, r) => sum + (r.exchange_take_everest || 0), 0);
  const totalExchangeGiveOther = refills.reduce((sum, r) => sum + (r.exchange_give_other || 0), 0);
  const totalExchangeTakeOther = refills.reduce((sum, r) => sum + (r.exchange_take_other || 0), 0);

  const totalFilled = totalLokpriyaFilled + totalSugamFilled + totalEverestFilled;
  const totalEmpty = totalLokpriyaEmpty + totalSugamEmpty + totalEverestEmpty;

  // Helper function to render refill details based on mode
  const renderRefillDetails = (refill) => {
    if (refill.mode === 'exchange') {
      // Exchange mode display - Show ALL cylinders that have non-zero values
      const hasLokpriya = (refill.exchange_give_lokpriya !== 0 || refill.exchange_take_lokpriya !== 0);
      const hasSugam = (refill.exchange_give_sugam !== 0 || refill.exchange_take_sugam !== 0);
      const hasEverest = (refill.exchange_give_everest !== 0 || refill.exchange_take_everest !== 0);
      const hasOther = (refill.exchange_give_other !== 0 || refill.exchange_take_other !== 0);
      
      if (!hasLokpriya && !hasSugam && !hasEverest && !hasOther) {
        return <div className="text-gray-500 text-sm">कुनै सिलिन्डर साटासाट भएन</div>;
      }
      
      return (
        <div className="space-y-2">
          <div className="text-sm font-bold text-purple-600 mb-2 flex items-center gap-2">
            <IconExchange className="w-4 h-4" />
            <span className="bg-purple-100 px-2 py-1 rounded">खाली साटासाट (Empty Exchange)</span>
          </div>
          
          {/* Lokpriya */}
          {hasLokpriya && (
            <div className="flex items-center justify-between p-2 bg-orange-50 rounded-lg">
              <div className="flex items-center gap-2">
                <IconLokpriya className="w-5 h-5" />
                <span className="font-semibold text-orange-800">लोकप्रिय</span>
              </div>
              <div className="flex gap-4">
                <span className="text-green-700 font-bold flex items-center gap-1">
                  <IconFilledCylinder className="w-4 h-4" /> +{refill.exchange_give_lokpriya || 0}
                </span>
                <span className="text-red-700 font-bold flex items-center gap-1">
                  <IconEmptyCylinder className="w-4 h-4" /> -{refill.exchange_take_lokpriya || 0}
                </span>
              </div>
            </div>
          )}
          
          {/* Sugam */}
          {hasSugam && (
            <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2">
                <IconSugam className="w-5 h-5" />
                <span className="font-semibold text-green-800">सुगम</span>
              </div>
              <div className="flex gap-4">
                <span className="text-green-700 font-bold flex items-center gap-1">
                  <IconFilledCylinder className="w-4 h-4" /> +{refill.exchange_give_sugam || 0}
                </span>
                <span className="text-red-700 font-bold flex items-center gap-1">
                  <IconEmptyCylinder className="w-4 h-4" /> -{refill.exchange_take_sugam || 0}
                </span>
              </div>
            </div>
          )}
          
          {/* Everest */}
          {hasEverest && (
            <div className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2">
                <IconEverest className="w-5 h-5" />
                <span className="font-semibold text-blue-800">एभरेस्ट</span>
              </div>
              <div className="flex gap-4">
                <span className="text-green-700 font-bold flex items-center gap-1">
                  <IconFilledCylinder className="w-4 h-4" /> +{refill.exchange_give_everest || 0}
                </span>
                <span className="text-red-700 font-bold flex items-center gap-1">
                  <IconEmptyCylinder className="w-4 h-4" /> -{refill.exchange_take_everest || 0}
                </span>
              </div>
            </div>
          )}
          
          {/* Other */}
          {hasOther && (
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-gray-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-xs font-bold">O</span>
                </div>
                <span className="font-semibold text-gray-800">अन्य</span>
              </div>
              <div className="flex gap-4">
                <span className="text-green-700 font-bold flex items-center gap-1">
                  <IconFilledCylinder className="w-4 h-4" /> +{refill.exchange_give_other || 0}
                </span>
                <span className="text-red-700 font-bold flex items-center gap-1">
                  <IconEmptyCylinder className="w-4 h-4" /> -{refill.exchange_take_other || 0}
                </span>
              </div>
            </div>
          )}
        </div>
      );
    } else {
      // Normal mode display
      const hasLokpriya = (refill.lokpriya_filled !== 0 || refill.lokpriya_empty !== 0);
      const hasSugam = (refill.sugam_filled !== 0 || refill.sugam_empty !== 0);
      const hasEverest = (refill.everest_filled !== 0 || refill.everest_empty !== 0);
      const hasOther = (refill.other_filled !== 0 || refill.other_empty !== 0);
      
      if (!hasLokpriya && !hasSugam && !hasEverest && !hasOther) {
        return <div className="text-gray-500 text-sm">कुनै सिलिन्डर रिफिल भएन</div>;
      }
      
      return (
        <div className="space-y-2">
          {/* Lokpriya */}
          {hasLokpriya && (
            <div className="flex items-center justify-between p-2 bg-orange-50 rounded-lg">
              <div className="flex items-center gap-2">
                <IconLokpriya className="w-5 h-5" />
                <span className="font-semibold text-orange-800">लोकप्रिय</span>
              </div>
              <div className="flex gap-4">
                <span className="text-green-700 font-bold flex items-center gap-1">
                  <IconFilledCylinder className="w-4 h-4" /> +{refill.lokpriya_filled}
                </span>
                <span className="text-red-700 font-bold flex items-center gap-1">
                  <IconEmptyCylinder className="w-4 h-4" /> -{refill.lokpriya_empty}
                </span>
              </div>
            </div>
          )}
          
          {/* Sugam */}
          {hasSugam && (
            <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2">
                <IconSugam className="w-5 h-5" />
                <span className="font-semibold text-green-800">सुगम</span>
              </div>
              <div className="flex gap-4">
                <span className="text-green-700 font-bold flex items-center gap-1">
                  <IconFilledCylinder className="w-4 h-4" /> +{refill.sugam_filled}
                </span>
                <span className="text-red-700 font-bold flex items-center gap-1">
                  <IconEmptyCylinder className="w-4 h-4" /> -{refill.sugam_empty}
                </span>
              </div>
            </div>
          )}
          
          {/* Everest */}
          {hasEverest && (
            <div className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2">
                <IconEverest className="w-5 h-5" />
                <span className="font-semibold text-blue-800">एभरेस्ट</span>
              </div>
              <div className="flex gap-4">
                <span className="text-green-700 font-bold flex items-center gap-1">
                  <IconFilledCylinder className="w-4 h-4" /> +{refill.everest_filled}
                </span>
                <span className="text-red-700 font-bold flex items-center gap-1">
                  <IconEmptyCylinder className="w-4 h-4" /> -{refill.everest_empty}
                </span>
              </div>
            </div>
          )}
          
          {/* Other */}
          {hasOther && (
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-gray-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-xs font-bold">O</span>
                </div>
                <span className="font-semibold text-gray-800">अन्य</span>
              </div>
              <div className="flex gap-4">
                <span className="text-green-700 font-bold flex items-center gap-1">
                  <IconFilledCylinder className="w-4 h-4" /> +{refill.other_filled}
                </span>
                <span className="text-red-700 font-bold flex items-center gap-1">
                  <IconEmptyCylinder className="w-4 h-4" /> -{refill.other_empty}
                </span>
              </div>
            </div>
          )}
        </div>
      );
    }
  };

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        {/* Header Section */}
        <div className="p-4 bg-gradient-to-r from-blue-700 to-blue-500 border-b">
          <h2 className="text-2xl font-bold text-white">रिफिल इतिहास</h2>
          <p className="text-blue-50 text-base mt-1">सिलिन्डर रिफिल र साटासाटको विवरण</p>
        </div>

        <div className="p-5">
          {/* Search Section */}
          <div className="mb-6">
            <label className="block text-lg font-bold text-gray-800 mb-2">खोज्नुहोस्</label>
            <div className="relative">
              <IconSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="मिति वा नोटले खोज्नुहोस्..."
                className="w-full pl-11 pr-4 py-3 text-lg border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all font-semibold shadow-sm"
              />
            </div>
          </div>

          {/* Summary Statistics - Updated to include ALL exchange stats */}
          {refills.length > 0 && (
            <div className="mb-6 p-5 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl border border-indigo-200">
              <div className="flex items-center gap-2 mb-4">
                <IconTrendingUp className="w-6 h-6 text-indigo-600" />
                <h3 className="text-lg font-bold text-indigo-900">कुल रिफिल सारांश</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Normal Mode Stats */}
                <div className="bg-white p-3 rounded-lg shadow-sm">
                  <div className="font-bold text-gray-700 mb-2">सामान्य रिफिल</div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <IconLokpriya className="w-4 h-4" />
                        <span>लोकप्रिय</span>
                      </div>
                      <div className="flex gap-3">
                        <span className="text-green-600 font-bold">+{totalLokpriyaFilled}</span>
                        <span className="text-red-600 font-bold">-{totalLokpriyaEmpty}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <IconSugam className="w-4 h-4" />
                        <span>सुगम</span>
                      </div>
                      <div className="flex gap-3">
                        <span className="text-green-600 font-bold">+{totalSugamFilled}</span>
                        <span className="text-red-600 font-bold">-{totalSugamEmpty}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <IconEverest className="w-4 h-4" />
                        <span>एभरेस्ट</span>
                      </div>
                      <div className="flex gap-3">
                        <span className="text-green-600 font-bold">+{totalEverestFilled}</span>
                        <span className="text-red-600 font-bold">-{totalEverestEmpty}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Exchange Mode Stats - Show ALL cylinder types */}
                <div className="bg-purple-50 p-3 rounded-lg shadow-sm">
                  <div className="font-bold text-purple-700 mb-2 flex items-center gap-2">
                    <IconExchange className="w-4 h-4" />
                    खाली साटासाट
                  </div>
                  <div className="space-y-2 text-sm">
                    {(totalExchangeGiveLokpriya !== 0 || totalExchangeTakeLokpriya !== 0) && (
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <IconLokpriya className="w-4 h-4" />
                          <span>लोकप्रिय</span>
                        </div>
                        <div className="flex gap-3">
                          <span className="text-green-600 font-bold">+{totalExchangeGiveLokpriya}</span>
                          <span className="text-red-600 font-bold">-{totalExchangeTakeLokpriya}</span>
                        </div>
                      </div>
                    )}
                    {(totalExchangeGiveSugam !== 0 || totalExchangeTakeSugam !== 0) && (
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <IconSugam className="w-4 h-4" />
                          <span>सुगम</span>
                        </div>
                        <div className="flex gap-3">
                          <span className="text-green-600 font-bold">+{totalExchangeGiveSugam}</span>
                          <span className="text-red-600 font-bold">-{totalExchangeTakeSugam}</span>
                        </div>
                      </div>
                    )}
                    {(totalExchangeGiveEverest !== 0 || totalExchangeTakeEverest !== 0) && (
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <IconEverest className="w-4 h-4" />
                          <span>एभरेस्ट</span>
                        </div>
                        <div className="flex gap-3">
                          <span className="text-green-600 font-bold">+{totalExchangeGiveEverest}</span>
                          <span className="text-red-600 font-bold">-{totalExchangeTakeEverest}</span>
                        </div>
                      </div>
                    )}
                    {(totalExchangeGiveOther !== 0 || totalExchangeTakeOther !== 0) && (
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600">अन्य</span>
                        </div>
                        <div className="flex gap-3">
                          <span className="text-green-600 font-bold">+{totalExchangeGiveOther}</span>
                          <span className="text-red-600 font-bold">-{totalExchangeTakeOther}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Refresh Button */}
          <button
            onClick={loadRefillHistory}
            disabled={loading}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white py-4 rounded-xl font-bold text-lg shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mb-6"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                लोड हुँदै...
              </>
            ) : (
              <>
                <IconRefresh className="w-5 h-5" />
                ताजा गर्नुहोस्
              </>
            )}
          </button>

          {/* Refill List */}
          {loading && refills.length === 0 ? (
            <div className="flex justify-center py-12">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredRefills.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <IconCalendar className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-bold text-gray-500">कुनै रिफिल इतिहास छैन</p>
              <p className="text-base mt-1">अहिलेसम्म कुनै रिफिल वा साटासाट रेकर्ड छैन</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredRefills.map((r, idx) => (
                <div key={idx} className="bg-gray-50 rounded-xl p-5 border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200">
                    <IconCalendar className="w-5 h-5 text-blue-600" />
                    <span className="font-bold text-xl text-gray-900">{r.refill_date}</span>
                    {r.mode === 'exchange' && (
                      <span className="ml-auto text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-semibold flex items-center gap-1">
                        <IconExchange className="w-3 h-3" />
                        साटासाट
                      </span>
                    )}
                  </div>
                  
                  {renderRefillDetails(r)}
                  
                  {r.notes && (
                    <div className="mt-3 pt-2 border-t border-gray-200">
                      <div className="flex items-start gap-2">
                        <span className="text-sm text-gray-600 font-medium">{r.notes}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default RefillHistory;