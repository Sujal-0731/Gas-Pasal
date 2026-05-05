import React, { useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL;
const PIN_CODE = import.meta.env.VITE_PIN_CODE;

function DealerRefill({ setMessage }) {
  const [refillDate, setRefillDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  
  // Dealer gives (Filled) - What dealer gives to you
  const [dealerGivesLokpriyaFilled, setDealerGivesLokpriyaFilled] = useState(0);
  const [dealerGivesSugamFilled, setDealerGivesSugamFilled] = useState(0);
  const [dealerGivesEverestFilled, setDealerGivesEverestFilled] = useState(0);
  
  // Dealer takes (Empty) - What dealer takes from you
  const [dealerTakesLokpriyaEmpty, setDealerTakesLokpriyaEmpty] = useState(0);
  const [dealerTakesSugamEmpty, setDealerTakesSugamEmpty] = useState(0);
  const [dealerTakesEverestEmpty, setDealerTakesEverestEmpty] = useState(0);
  
  const [notes, setNotes] = useState('');

  const saveRefill = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/refills`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-pin': PIN_CODE
        },
        body: JSON.stringify({
          refillDate,
          lokpriyaFilled: dealerGivesLokpriyaFilled,
          lokpriyaEmpty: dealerTakesLokpriyaEmpty,
          sugamFilled: dealerGivesSugamFilled,
          sugamEmpty: dealerTakesSugamEmpty,
          everestFilled: dealerGivesEverestFilled,
          everestEmpty: dealerTakesEverestEmpty,
          notes
        })
      });
      const data = await res.json();
      if (data.success) {
        setMessage('✅ रिफिल सुरक्षित गरियो');
        setDealerGivesLokpriyaFilled(0); setDealerTakesLokpriyaEmpty(0);
        setDealerGivesSugamFilled(0); setDealerTakesSugamEmpty(0);
        setDealerGivesEverestFilled(0); setDealerTakesEverestEmpty(0);
        setNotes('');
      } else {
        setMessage('❌ ' + data.message);
      }
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('❌ इन्टरनेट जडान जाँच गर्नुहोस्');
      setTimeout(() => setMessage(''), 3000);
    }
    setLoading(false);
  };

  // Handle number input change
  const handleNumberChange = (setter, value) => {
    const num = parseInt(value) || 0;
    if (num >= 0 && num <= 999) {
      setter(num);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-5 shadow-md">
      <h2 className="text-xl font-bold text-blue-900 border-l-4 border-orange-500 pl-3 mb-4">
        🚚 डिलर रिफिल
      </h2>

      <div className="mb-4">
        <label className="block font-semibold mb-2 text-lg">📅 मिति / Date</label>
        <input
          type="date"
          value={refillDate}
          onChange={(e) => setRefillDate(e.target.value)}
          className="w-full p-4 border-2 border-gray-300 rounded-xl text-lg"
        />
      </div>

      {/* Lokpriya */}
      <div className="bg-gray-50 rounded-xl p-4 mb-4">
        <div className="font-bold text-lg mb-3">🟦 लोकप्रिय / Lokpriya</div>
        
        <div className="mb-3">
          <label className="block font-medium mb-1">
            भरिएको / Filled 
            <span className="text-xs text-green-600 ml-2">(डिलरले दियो / Dealer gives)</span>
          </label>
          <input
            type="number"
            value={dealerGivesLokpriyaFilled}
            onChange={(e) => handleNumberChange(setDealerGivesLokpriyaFilled, e.target.value)}
            className="w-full p-4 text-xl font-bold border-2 border-gray-300 rounded-xl"
            min="0"
            placeholder="०"
          />
        </div>

        <div>
          <label className="block font-medium mb-1">
            खाली / Empty 
            <span className="text-xs text-red-600 ml-2">(डिलरले लग्यो / Dealer takes)</span>
          </label>
          <input
            type="number"
            value={dealerTakesLokpriyaEmpty}
            onChange={(e) => handleNumberChange(setDealerTakesLokpriyaEmpty, e.target.value)}
            className="w-full p-4 text-xl font-bold border-2 border-gray-300 rounded-xl"
            min="0"
            placeholder="०"
          />
        </div>
      </div>

      {/* Sugam */}
      <div className="bg-gray-50 rounded-xl p-4 mb-4">
        <div className="font-bold text-lg mb-3">🟩 सुगम / Sugam</div>
        
        <div className="mb-3">
          <label className="block font-medium mb-1">
            भरिएको / Filled 
            <span className="text-xs text-green-600 ml-2">(डिलरले दियो / Dealer gives)</span>
          </label>
          <input
            type="number"
            value={dealerGivesSugamFilled}
            onChange={(e) => handleNumberChange(setDealerGivesSugamFilled, e.target.value)}
            className="w-full p-4 text-xl font-bold border-2 border-gray-300 rounded-xl"
            min="0"
            placeholder="०"
          />
        </div>

        <div>
          <label className="block font-medium mb-1">
            खाली / Empty 
            <span className="text-xs text-red-600 ml-2">(डिलरले लग्यो / Dealer takes)</span>
          </label>
          <input
            type="number"
            value={dealerTakesSugamEmpty}
            onChange={(e) => handleNumberChange(setDealerTakesSugamEmpty, e.target.value)}
            className="w-full p-4 text-xl font-bold border-2 border-gray-300 rounded-xl"
            min="0"
            placeholder="०"
          />
        </div>
      </div>

      {/* Everest */}
      <div className="bg-gray-50 rounded-xl p-4 mb-4">
        <div className="font-bold text-lg mb-3">🟧 एभरेस्ट / Everest</div>
        
        <div className="mb-3">
          <label className="block font-medium mb-1">
            भरिएको / Filled 
            <span className="text-xs text-green-600 ml-2">(डिलरले दियो / Dealer gives)</span>
          </label>
          <input
            type="number"
            value={dealerGivesEverestFilled}
            onChange={(e) => handleNumberChange(setDealerGivesEverestFilled, e.target.value)}
            className="w-full p-4 text-xl font-bold border-2 border-gray-300 rounded-xl"
            min="0"
            placeholder="०"
          />
        </div>

        <div>
          <label className="block font-medium mb-1">
            खाली / Empty 
            <span className="text-xs text-red-600 ml-2">(डिलरले लग्यो / Dealer takes)</span>
          </label>
          <input
            type="number"
            value={dealerTakesEverestEmpty}
            onChange={(e) => handleNumberChange(setDealerTakesEverestEmpty, e.target.value)}
            className="w-full p-4 text-xl font-bold border-2 border-gray-300 rounded-xl"
            min="0"
            placeholder="०"
          />
        </div>
      </div>

      <div className="bg-blue-50 p-3 rounded-xl mb-4 text-sm">
        <p className="font-bold mb-1">📌 उदाहरण / Example:</p>
        <p>डिलरले ८ भरिएको दियो र १० खाली लग्यो भने:</p>
        <p>• भरिएको / Filled: 8</p>
        <p>• खाली / Empty: 10</p>
      </div>

      <div className="mb-4">
        <label className="block font-semibold mb-2 text-lg">📝 नोट / Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows="2"
          placeholder="जस्तै: १० खाली दिएर ८ भरिएको लिएको"
          className="w-full p-4 border-2 border-gray-300 rounded-xl text-lg"
        />
      </div>

      <button
        onClick={saveRefill}
        disabled={loading}
        className="w-full bg-blue-900 text-white py-4 rounded-full font-bold text-lg"
      >
        ✅ रिफिल सुरक्षित गर्नुहोस् / Save Refill
      </button>
    </div>
  );
}

export default DealerRefill;