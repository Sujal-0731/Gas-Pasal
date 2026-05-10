import React, { useState, useEffect } from 'react';
import { 
  IconDealer, 
  IconPlus, 
  IconRefresh,
  IconAlertCircle,
  IconChevronLeft,
  IconChevronRight,
  IconCalendar,
  IconFilledCylinder,
  IconEmptyCylinder,
  IconLokpriya,
  IconSugam,
  IconEverest,
  IconOther,
  IconCheck,
  IconX
} from '../components/icons';
import { getAuthHeader } from '../utils/api';

const API_URL = import.meta.env.VITE_API_URL;

function DealerRefill({ showToast }) {
  const [refillDate, setRefillDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [refills, setRefills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('normal');
  const [showHistory, setShowHistory] = useState(false);
  
  const [lokpriyaGive, setLokpriyaGive] = useState(0);
  const [lokpriyaTake, setLokpriyaTake] = useState(0);
  const [sugamGive, setSugamGive] = useState(0);
  const [sugamTake, setSugamTake] = useState(0);
  const [everestGive, setEverestGive] = useState(0);
  const [everestTake, setEverestTake] = useState(0);
  const [otherGive, setOtherGive] = useState(0);
  const [otherTake, setOtherTake] = useState(0);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadRefillHistory();
  }, []);

  const loadRefillHistory = async () => {
    try {
      const response = await fetch(`${API_URL}/refills`, {
        headers: getAuthHeader()
      });
      const data = await response.json();
      if (data.success) {
        setRefills(data.refills);
      }
    } catch (error) {
      console.error('Error loading refills:', error);
    }
  };

  const saveRefill = async () => {
    setLoading(true);
    try {
      let sendData;
      
      if (mode === 'normal') {
        sendData = {
          refillDate,
          lokpriyaFilled: lokpriyaGive,
          lokpriyaEmpty: lokpriyaTake,
          sugamFilled: sugamGive,
          sugamEmpty: sugamTake,
          everestFilled: everestGive,
          everestEmpty: everestTake,
          otherFilled: otherGive,
          otherEmpty: otherTake,
          notes,
          mode: 'normal'
        };
      } else {
        sendData = {
          refillDate,
          mode: 'exchange',
          notes: notes || 'खाली साटासाट',
          exchange_give_lokpriya: lokpriyaGive,
          exchange_give_sugam: sugamGive,
          exchange_give_everest: everestGive,
          exchange_give_other: otherGive,
          exchange_take_lokpriya: lokpriyaTake,
          exchange_take_sugam: sugamTake,
          exchange_take_everest: everestTake,
          exchange_take_other: otherTake
        };
      }
      
      const response = await fetch(`${API_URL}/refills`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify(sendData)
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        showToast(mode === 'normal' ? 'रिफिल सुरक्षित गरियो' : 'खाली साटासाट सुरक्षित गरियो', 'success');
        
        // Reset form
        setLokpriyaGive(0);
        setLokpriyaTake(0);
        setSugamGive(0);
        setSugamTake(0);
        setEverestGive(0);
        setEverestTake(0);
        setOtherGive(0);
        setOtherTake(0);
        setNotes('');
        
        // Reload history
        await loadRefillHistory();
        
      } else {
        const errorMessage = data.message || (mode === 'normal' ? 'रिफिल सेभ गर्न असफल' : 'साटासाट सेभ गर्न असफल');
        showToast(errorMessage, 'error');
      }
      
    } catch (error) {
      console.error('Save error:', error);
      showToast('इन्टरनेट जडान जाँच गर्नुहोस्', 'error');
    }
    setLoading(false);
  };

  const handleNumberChange = (setter, value) => {
    const cleanValue = value.replace(/[^0-9]/g, '');
    const num = cleanValue === '' ? 0 : parseInt(cleanValue, 10);
    if (num >= 0 && num <= 999) {
      setter(num);
    }
  };

  const formatValue = (val) => val === 0 ? '' : val;

  const getTotalStats = () => {
    const totalFilled = refills.reduce((sum, r) => sum + (r.lokpriya_filled || 0) + (r.sugam_filled || 0) + (r.everest_filled || 0) + (r.other_filled || 0), 0);
    const totalEmpty = refills.reduce((sum, r) => sum + (r.lokpriya_empty || 0) + (r.sugam_empty || 0) + (r.everest_empty || 0) + (r.other_empty || 0), 0);
    return { totalFilled, totalEmpty };
  };

  const { totalFilled, totalEmpty } = getTotalStats();

  if (showHistory) {
    return (
      <div className="space-y-5">
        <button
          onClick={() => setShowHistory(false)}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors"
        >
          <IconChevronLeft className="w-6 h-6" />
          <span className="text-lg font-medium">नयाँ रिफिल</span>
        </button>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 bg-gradient-to-r from-blue-600 to-indigo-600">
            <h2 className="text-2xl font-bold text-white">रिफिल इतिहास</h2>
            <p className="text-white/80 text-lg mt-1">कुल रिफिल: {refills.length}</p>
          </div>

          <div className="p-5">
            <div className="grid grid-cols-2 gap-4 mb-5">
              <div className="bg-green-50 rounded-xl p-4 text-center">
                <IconFilledCylinder className="w-10 h-10 text-green-600 mx-auto mb-2" />
                <div className="text-3xl font-bold text-green-700">{totalFilled}</div>
                <div className="text-base text-gray-600 mt-1 font-medium">जम्मा भरिएको</div>
              </div>
              <div className="bg-red-50 rounded-xl p-4 text-center">
                <IconEmptyCylinder className="w-10 h-10 text-red-500 mx-auto mb-2" />
                <div className="text-3xl font-bold text-red-600">{totalEmpty}</div>
                <div className="text-base text-gray-600 mt-1 font-medium">जम्मा खाली</div>
              </div>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {refills.length === 0 ? (
                <div className="text-center text-gray-400 py-8 text-lg">कुनै रिफिल इतिहास छैन</div>
              ) : (
                refills.map((r, idx) => (
                  <div key={idx} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <div className="flex items-center gap-2 text-gray-700 mb-3 pb-2 border-b border-gray-200">
                      <IconCalendar className="w-5 h-5" />
                      <span className="font-bold text-lg">{r.refill_date}</span>
                      {r.mode === 'exchange' && (
                        <span className="ml-auto text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded-full">
                          साटासाट
                        </span>
                      )}
                    </div>
                    {r.mode === 'exchange' ? (
                      <>
                        <div className="space-y-2 text-base">
                          {(r.exchange_give_lokpriya !== 0 || r.exchange_take_lokpriya !== 0) && (
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <IconLokpriya className="w-6 h-6" />
                                <span>लोकप्रिय</span>
                              </div>
                              <div className="flex gap-3">
                                <span className="text-green-600">+{r.exchange_give_lokpriya || 0}</span>
                                <span className="text-red-600">-{r.exchange_take_lokpriya || 0}</span>
                              </div>
                            </div>
                          )}
                          {(r.exchange_give_sugam !== 0 || r.exchange_take_sugam !== 0) && (
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <IconSugam className="w-6 h-6" />
                                <span>सुगम</span>
                              </div>
                              <div className="flex gap-3">
                                <span className="text-green-600">+{r.exchange_give_sugam || 0}</span>
                                <span className="text-red-600">-{r.exchange_take_sugam || 0}</span>
                              </div>
                            </div>
                          )}
                          {(r.exchange_give_everest !== 0 || r.exchange_take_everest !== 0) && (
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <IconEverest className="w-6 h-6" />
                                <span>एभरेस्ट</span>
                              </div>
                              <div className="flex gap-3">
                                <span className="text-green-600">+{r.exchange_give_everest || 0}</span>
                                <span className="text-red-600">-{r.exchange_take_everest || 0}</span>
                              </div>
                            </div>
                          )}
                          {(r.exchange_give_other !== 0 || r.exchange_take_other !== 0) && (
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <IconOther className="w-6 h-6" />
                                <span>अन्य</span>
                              </div>
                              <div className="flex gap-3">
                                <span className="text-green-600">+{r.exchange_give_other || 0}</span>
                                <span className="text-red-600">-{r.exchange_take_other || 0}</span>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="text-xs font-medium text-purple-600 mt-2">खाली साटासाट</div>
                      </>
                    ) : (
                      <div className="space-y-2 text-base">
                        {(r.lokpriya_filled !== 0 || r.lokpriya_empty !== 0) && (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <IconLokpriya className="w-6 h-6" />
                              <span>लोकप्रिय</span>
                            </div>
                            <div className="flex gap-3">
                              <span className="text-green-600">+{r.lokpriya_filled || 0}</span>
                              <span className="text-red-600">-{r.lokpriya_empty || 0}</span>
                            </div>
                          </div>
                        )}
                        {(r.sugam_filled !== 0 || r.sugam_empty !== 0) && (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <IconSugam className="w-6 h-6" />
                              <span>सुगम</span>
                            </div>
                            <div className="flex gap-3">
                              <span className="text-green-600">+{r.sugam_filled || 0}</span>
                              <span className="text-red-600">-{r.sugam_empty || 0}</span>
                            </div>
                          </div>
                        )}
                        {(r.everest_filled !== 0 || r.everest_empty !== 0) && (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <IconEverest className="w-6 h-6" />
                              <span>एभरेस्ट</span>
                            </div>
                            <div className="flex gap-3">
                              <span className="text-green-600">+{r.everest_filled || 0}</span>
                              <span className="text-red-600">-{r.everest_empty || 0}</span>
                            </div>
                          </div>
                        )}
                        {(r.other_filled !== 0 || r.other_empty !== 0) && (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <IconOther className="w-6 h-6" />
                              <span>अन्य</span>
                            </div>
                            <div className="flex gap-3">
                              <span className="text-green-600">+{r.other_filled || 0}</span>
                              <span className="text-red-600">-{r.other_empty || 0}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    {r.notes && <div className="text-sm text-gray-500 mt-2 pt-1 border-t border-gray-100 italic">{r.notes}</div>}
                  </div>
                ))
              )}
            </div>

            <button
              onClick={loadRefillHistory}
              className="w-full mt-5 bg-gray-100 hover:bg-gray-200 text-gray-700 py-4 rounded-xl font-bold text-lg transition-colors flex items-center justify-center gap-2"
            >
              <IconRefresh className="w-6 h-6" />
              ताजा गर्नुहोस्
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 bg-gradient-to-r from-blue-600 to-indigo-600">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-white">डिलर रिफिल</h2>
              <p className="text-white/80 text-lg mt-1">विवरण भर्नुहोस्</p>
            </div>
            <button
              onClick={() => setShowHistory(true)}
              className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              इतिहास हेर्नुहोस्
            </button>
          </div>
        </div>

        <div className="p-5">
          <div className="grid grid-cols-2 gap-3 mb-5">
            <button
              onClick={() => setMode('normal')}
              className={`py-4 rounded-xl font-bold text-lg transition-all ${
                mode === 'normal'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <div>सामान्य रिफिल</div>
              <div className="text-xs font-normal opacity-80">Normal Refill</div>
            </button>
            <button
              onClick={() => setMode('exchange')}
              className={`py-4 rounded-xl font-bold text-lg transition-all ${
                mode === 'exchange'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <div>खाली साटासाट</div>
              <div className="text-xs font-normal opacity-80">Empty Exchange</div>
            </button>
          </div>

          <div className={`p-5 rounded-xl mb-5 text-lg ${
            mode === 'normal' ? 'bg-green-50 border border-green-200' : 'bg-purple-50 border border-purple-200'
          }`}>
            {mode === 'normal' ? (
              <>
                <p className="font-bold mb-2 text-xl">सामान्य रिफिल:</p>
                <p className="text-gray-700">• <span className="text-green-600 font-bold">दियो (Give)</span> → डिलरले दिएको भरिएको ग्यास (स्टक बढ्छ)</p>
                <p className="text-gray-700">• <span className="text-red-600 font-bold">लग्यो (Take)</span> → डिलरले लगेको खाली सिलिन्डर (स्टक घट्छ)</p>
              </>
            ) : (
              <>
                <p className="font-bold mb-2 text-xl">खाली साटासाट:</p>
                <p className="text-gray-700">• <span className="text-green-600 font-bold">दियो (Give)</span> → डिलरले दिएको खाली सिलिन्डर (स्टक बढ्छ)</p>
                <p className="text-gray-700">• <span className="text-red-600 font-bold">आयो (Take)</span> → डिलरले लगेको खाली सिलिन्डर (स्टक घट्छ)</p>
              </>
            )}
          </div>

          <div className="mb-6">
            <label className="block text-xl font-bold text-gray-700 mb-2 flex items-center gap-2">
              <IconCalendar className="w-6 h-6" />
              मिति
            </label>
            <input
              type="date"
              value={refillDate}
              onChange={(e) => setRefillDate(e.target.value)}
              className="w-full p-4 text-xl border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all font-medium"
            />
          </div>

          {[
            { label: 'लोकप्रिय', give: lokpriyaGive, setGive: setLokpriyaGive, take: lokpriyaTake, setTake: setLokpriyaTake, icon: <IconLokpriya className="w-8 h-8" /> },
            { label: 'सुगम', give: sugamGive, setGive: setSugamGive, take: sugamTake, setTake: setSugamTake, icon: <IconSugam className="w-8 h-8" /> },
            { label: 'एभरेस्ट', give: everestGive, setGive: setEverestGive, take: everestTake, setTake: setEverestTake, icon: <IconEverest className="w-8 h-8" /> },
            { label: 'अन्य', give: otherGive, setGive: setOtherGive, take: otherTake, setTake: setOtherTake, icon: <IconOther className="w-8 h-8" /> }
          ].map((brand, i) => (
            <div key={i} className="bg-gray-50 rounded-xl p-5 mb-5 border border-gray-100">
              <div className="flex items-center gap-3 mb-4">
                {brand.icon}
                <span className="font-black text-gray-800 text-xl">{brand.label}</span>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-base font-bold text-green-700 mb-2 block flex items-center gap-1 uppercase">
                    <IconFilledCylinder className="w-5 h-5" />
                    दियो
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formatValue(brand.give)}
                    onChange={(e) => handleNumberChange(brand.setGive, e.target.value)}
                    className="w-full p-4 text-center text-2xl font-black border-2 border-green-200 rounded-2xl focus:border-green-500 focus:outline-none transition-all shadow-sm"
                    placeholder="०"
                  />
                </div>
                <div>
                  <label className="text-base font-bold text-red-700 mb-2 block flex items-center gap-1 uppercase">
                    <IconEmptyCylinder className="w-5 h-5" />
                    लग्यो
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formatValue(brand.take)}
                    onChange={(e) => handleNumberChange(brand.setTake, e.target.value)}
                    className="w-full p-4 text-center text-2xl font-black border-2 border-red-200 rounded-2xl focus:border-red-500 focus:outline-none transition-all shadow-sm"
                    placeholder="०"
                  />
                </div>
              </div>
            </div>
          ))}

          <div className="mb-6">
            <label className="block text-xl font-bold text-gray-700 mb-2">नोट (Notes)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows="2"
              placeholder="केही जानकारी भए यहाँ लेख्नुहोस्..."
              className="w-full p-4 text-lg border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none transition-all resize-none font-medium"
            />
          </div>

          <button
            onClick={saveRefill}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-5 rounded-2xl font-black text-xl shadow-lg transition-transform active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 min-h-[64px]"
          >
            {loading ? (
              <>
                <div className="w-7 h-7 border-4 border-white border-t-transparent rounded-full animate-spin" />
                सेभ गर्दै...
              </>
            ) : (
              <>
                <IconPlus className="w-7 h-7" />
                रिफिल सुरक्षित गर्नुहोस्
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default DealerRefill;