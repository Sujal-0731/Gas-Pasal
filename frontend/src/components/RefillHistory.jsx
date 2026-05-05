import React, { useState, useEffect } from 'react';

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

  // Get summary statistics
  const totalLokpriyaFilled = refills.reduce((sum, r) => sum + (r.lokpriya_filled || 0), 0);
  const totalLokpriyaEmpty = refills.reduce((sum, r) => sum + (r.lokpriya_empty || 0), 0);
  const totalSugamFilled = refills.reduce((sum, r) => sum + (r.sugam_filled || 0), 0);
  const totalSugamEmpty = refills.reduce((sum, r) => sum + (r.sugam_empty || 0), 0);
  const totalEverestFilled = refills.reduce((sum, r) => sum + (r.everest_filled || 0), 0);
  const totalEverestEmpty = refills.reduce((sum, r) => sum + (r.everest_empty || 0), 0);

  return (
    <div className="bg-white rounded-2xl p-5 shadow-md">
      <h2 className="text-xl font-bold text-blue-900 border-l-4 border-orange-500 pl-3 mb-4">
        📜 रिफिल इतिहास / Refill History
      </h2>

      {/* Search */}
      <div className="mb-4">
        <label className="block font-semibold mb-2 text-lg">🔍 खोज्नुहोस् / Search</label>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="मिति वा नोटले खोज्नुहोस् / Search by date or notes"
          className="w-full p-4 border-2 border-gray-300 rounded-xl text-lg"
        />
      </div>

      {/* Summary Statistics */}
      {refills.length > 0 && (
        <div className="bg-indigo-50 p-4 rounded-xl mb-4">
          <h3 className="font-bold text-md mb-2">📊 कुल रिफिल सारांश / Summary</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>🟦 लोकप्रिय दियो: {totalLokpriyaFilled}</div>
            <div>🟦 लोकप्रिय लग्यो: {totalLokpriyaEmpty}</div>
            <div>🟩 सुगम दियो: {totalSugamFilled}</div>
            <div>🟩 सुगम लग्यो: {totalSugamEmpty}</div>
            <div>🟧 एभरेस्ट दियो: {totalEverestFilled}</div>
            <div>🟧 एभरेस्ट लग्यो: {totalEverestEmpty}</div>
          </div>
        </div>
      )}

      {/* Refresh Button */}
      <button
        onClick={loadRefillHistory}
        className="w-full bg-gray-600 text-white py-3 rounded-full font-semibold mb-4"
      >
        🔄 ताजा गर्नुहोस् / Refresh
      </button>

      {/* Refill List */}
      {loading ? (
        <div className="text-center py-8 text-gray-500">⏳ लोड हुँदै...</div>
      ) : filteredRefills.length === 0 ? (
        <div className="text-center text-gray-500 py-8">📭 कुनै रिफिल इतिहास छैन</div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredRefills.map((r, idx) => (
            <div key={idx} className="bg-gray-100 p-4 rounded-xl">
              <div className="font-bold text-lg mb-2">📅 {r.refill_date}</div>
              
              <div className="space-y-1 text-sm">
                {(r.lokpriya_filled !== 0 || r.lokpriya_empty !== 0) && (
                  <div>🟦 लोकप्रिय: दियो {r.lokpriya_filled} भरिएको, लग्यो {r.lokpriya_empty} खाली</div>
                )}
                {(r.sugam_filled !== 0 || r.sugam_empty !== 0) && (
                  <div>🟩 सुगम: दियो {r.sugam_filled} भरिएको, लग्यो {r.sugam_empty} खाली</div>
                )}
                {(r.everest_filled !== 0 || r.everest_empty !== 0) && (
                  <div>🟧 एभरेस्ट: दियो {r.everest_filled} भरिएको, लग्यो {r.everest_empty} खाली</div>
                )}
              </div>
              
              {r.notes && (
                <div className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-200">
                  📝 {r.notes}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default RefillHistory;