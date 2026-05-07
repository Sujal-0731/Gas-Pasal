import React, { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL;
const PIN_CODE = import.meta.env.VITE_PIN_CODE;

function DealerRefill({ showToast }) {
  const [refillDate, setRefillDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [refills, setRefills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('normal');
  
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
          lokpriyaFilled: 0,
          lokpriyaEmpty: lokpriyaTake,
          sugamFilled: 0,
          sugamEmpty: sugamTake,
          everestFilled: 0,
          everestEmpty: everestTake,
          otherFilled: 0,
          otherEmpty: otherTake,
          notes: notes ? `[EXCHANGE] ${notes}` : '[EXCHANGE] Empty exchange',
          mode: 'exchange',
          exchange_give_lokpriya: lokpriyaGive,
          exchange_give_sugam: sugamGive,
          exchange_give_everest: everestGive,
          exchange_give_other: otherGive
        };
      }
      
      const res = await fetch(`${API_URL}/refills`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-pin': PIN_CODE
        },
        body: JSON.stringify(sendData)
      });
      const data = await res.json();
      if (data.success) {
        showToast(mode === 'normal' ? 'रिफिल सुरक्षित गरियो' : 'खाली साटासाट सुरक्षित गरियो', 'success');
        
        setLokpriyaGive(0); setLokpriyaTake(0);
        setSugamGive(0); setSugamTake(0);
        setEverestGive(0); setEverestTake(0);
        setOtherGive(0); setOtherTake(0);
        setNotes('');
        loadRefillHistory();
      } else {
        showToast(`${data.message}`, 'error');
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

  return (
    <div className="bg-white rounded-2xl p-5 shadow-md">
      <h2 className="text-xl font-bold text-blue-900 border-l-4 border-orange-500 pl-3 mb-4">
        🚚 डिलर रिफिल
      </h2>

      {/* Mode Selection */}
      <div className="mb-4">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setMode('normal')}
            className={`py-3 rounded-xl font-semibold transition ${
              mode === 'normal'
                ? 'bg-blue-900 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 border border-gray-300'
            }`}
          >
            <div>🔄 सामान्य रिफिल</div>
            <div className="text-xs">Normal Refill</div>
          </button>
          <button
            onClick={() => setMode('exchange')}
            className={`py-3 rounded-xl font-semibold transition ${
              mode === 'exchange'
                ? 'bg-blue-900 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 border border-gray-300'
            }`}
          >
            <div>🔁 खाली साटासाट</div>
            <div className="text-xs">Empty Exchange</div>
          </button>
        </div>
      </div>

      <div className={`p-3 rounded-xl mb-4 text-sm ${
        mode === 'normal' ? 'bg-green-50 border border-green-200' : 'bg-purple-50 border border-purple-200'
      }`}>
        {mode === 'normal' ? (
          <>
            <p className="font-bold mb-1">📌 सामान्य रिफिल:</p>
            <p>• <span className="text-green-600">दियो (Give)</span> → डिलरले दिएको <strong>भरिएको</strong> सिलिन्डर</p>
            <p>• <span className="text-red-600">लग्यो (Take)</span> → डिलरले लगेको <strong>खाली</strong> सिलिन्डर</p>
          </>
        ) : (
          <>
            <p className="font-bold mb-1">📌 खाली साटासाट:</p>
            <p>• <span className="text-green-600">दियो (Give)</span> → डिलरले दिएको <strong>खाली</strong> सिलिन्डर</p>
            <p>• <span className="text-red-600">लग्यो (Take)</span> → डिलरले लगेको <strong>खाली</strong> सिलिन्डर</p>
          </>
        )}
      </div>

      <div className="mb-4">
        <label className="block font-semibold mb-2 text-lg">📅 मिति</label>
        <input
          type="date"
          value={refillDate}
          onChange={(e) => setRefillDate(e.target.value)}
          className="w-full p-4 border-2 border-gray-300 rounded-xl text-lg focus:border-blue-500 focus:outline-none"
        />
      </div>

      {/* Lokpriya */}
      <div className="bg-gray-50 rounded-xl p-4 mb-4">
        <div className="font-bold text-lg mb-3">🟦 लोकप्रिय / Lokpriya</div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-green-600">📤 दियो / Give</label>
            <input
              type="text"
              inputMode="numeric"
              value={formatValue(lokpriyaGive)}
              onChange={(e) => handleNumberChange(setLokpriyaGive, e.target.value)}
              className="w-full p-4 text-xl font-bold border-2 border-green-300 rounded-xl focus:border-green-500 focus:outline-none text-center"
              placeholder="०"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-red-600">📥 लग्यो / Take</label>
            <input
              type="text"
              inputMode="numeric"
              value={formatValue(lokpriyaTake)}
              onChange={(e) => handleNumberChange(setLokpriyaTake, e.target.value)}
              className="w-full p-4 text-xl font-bold border-2 border-red-300 rounded-xl focus:border-red-500 focus:outline-none text-center"
              placeholder="०"
            />
          </div>
        </div>
      </div>

      {/* Sugam */}
      <div className="bg-gray-50 rounded-xl p-4 mb-4">
        <div className="font-bold text-lg mb-3">🟩 सुगम / Sugam</div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-green-600">📤 दियो / Give</label>
            <input
              type="text"
              inputMode="numeric"
              value={formatValue(sugamGive)}
              onChange={(e) => handleNumberChange(setSugamGive, e.target.value)}
              className="w-full p-4 text-xl font-bold border-2 border-green-300 rounded-xl focus:border-green-500 focus:outline-none text-center"
              placeholder="०"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-red-600">📥 लग्यो / Take</label>
            <input
              type="text"
              inputMode="numeric"
              value={formatValue(sugamTake)}
              onChange={(e) => handleNumberChange(setSugamTake, e.target.value)}
              className="w-full p-4 text-xl font-bold border-2 border-red-300 rounded-xl focus:border-red-500 focus:outline-none text-center"
              placeholder="०"
            />
          </div>
        </div>
      </div>

      {/* Everest */}
      <div className="bg-gray-50 rounded-xl p-4 mb-4">
        <div className="font-bold text-lg mb-3">🟧 एभरेस्ट / Everest</div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-green-600">📤 दियो / Give</label>
            <input
              type="text"
              inputMode="numeric"
              value={formatValue(everestGive)}
              onChange={(e) => handleNumberChange(setEverestGive, e.target.value)}
              className="w-full p-4 text-xl font-bold border-2 border-green-300 rounded-xl focus:border-green-500 focus:outline-none text-center"
              placeholder="०"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-red-600">📥 लग्यो / Take</label>
            <input
              type="text"
              inputMode="numeric"
              value={formatValue(everestTake)}
              onChange={(e) => handleNumberChange(setEverestTake, e.target.value)}
              className="w-full p-4 text-xl font-bold border-2 border-red-300 rounded-xl focus:border-red-500 focus:outline-none text-center"
              placeholder="०"
            />
          </div>
        </div>
      </div>

      {/* Other */}
      <div className="bg-gray-50 rounded-xl p-4 mb-4">
        <div className="font-bold text-lg mb-3">🟪 अन्य / Other</div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-green-600">📤 दियो / Give</label>
            <input
              type="text"
              inputMode="numeric"
              value={formatValue(otherGive)}
              onChange={(e) => handleNumberChange(setOtherGive, e.target.value)}
              className="w-full p-4 text-xl font-bold border-2 border-green-300 rounded-xl focus:border-green-500 focus:outline-none text-center"
              placeholder="०"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-red-600">📥 लग्यो / Take</label>
            <input
              type="text"
              inputMode="numeric"
              value={formatValue(otherTake)}
              onChange={(e) => handleNumberChange(setOtherTake, e.target.value)}
              className="w-full p-4 text-xl font-bold border-2 border-red-300 rounded-xl focus:border-red-500 focus:outline-none text-center"
              placeholder="०"
            />
          </div>
        </div>
      </div>

      <div className="mb-4">
        <label className="block font-semibold mb-2 text-lg">📝 नोट</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows="2"
          placeholder="जस्तै: १० खाली दिएर ८ भरिएको लिएको"
          className="w-full p-4 border-2 border-gray-300 rounded-xl text-lg focus:border-blue-500 focus:outline-none"
        />
      </div>

      <button
        onClick={saveRefill}
        disabled={loading}
        className="w-full bg-blue-900 text-white py-4 rounded-full font-bold text-lg hover:bg-blue-800 transition disabled:opacity-50"
      >
        {loading ? 'सेभ गर्दै...' : '✅ रिफिल सुरक्षित गर्नुहोस्'}
      </button>

      <hr className="my-5" />

      <h3 className="font-bold text-lg mb-3">📜 रिफिल इतिहास</h3>
      <div className="max-h-80 overflow-y-auto space-y-2">
        {refills.map((r, idx) => (
          <div key={idx} className="bg-gray-100 p-3 rounded-xl">
            <div className="font-bold">📅 {r.refill_date}</div>
            {r.mode === 'exchange' ? (
              <>
                <div>🟦 लोकप्रिय: दियो {r.exchange_give_lokpriya || 0}, लग्यो {r.lokpriya_empty || 0}</div>
                <div>🟩 सुगम: दियो {r.exchange_give_sugam || 0}, लग्यो {r.sugam_empty || 0}</div>
                <div>🟧 एभरेस्ट: दियो {r.exchange_give_everest || 0}, लग्यो {r.everest_empty || 0}</div>
                <div>🟪 अन्य: दियो {r.exchange_give_other || 0}, लग्यो {r.other_empty || 0}</div>
                <div className="text-xs text-purple-600 mt-1">🔄 खाली साटासाट</div>
              </>
            ) : (
              <>
                <div>🟦 लोकप्रिय: दियो {r.lokpriya_filled || 0} भरिएको, लग्यो {r.lokpriya_empty || 0} खाली</div>
                <div>🟩 सुगम: दियो {r.sugam_filled || 0} भरिएको, लग्यो {r.sugam_empty || 0} खाली</div>
                <div>🟧 एभरेस्ट: दियो {r.everest_filled || 0} भरिएको, लग्यो {r.everest_empty || 0} खाली</div>
                <div>🟪 अन्य: दियो {r.other_filled || 0} भरिएको, लग्यो {r.other_empty || 0} खाली</div>
              </>
            )}
            {r.notes && <div className="text-xs text-gray-500 mt-1">📝 {r.notes}</div>}
          </div>
        ))}
        {refills.length === 0 && <div className="text-center text-gray-500 py-4">📭 कुनै रिफिल इतिहास छैन</div>}
      </div>
    </div>
  );
}

export default DealerRefill;