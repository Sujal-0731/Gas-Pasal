import React, { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL;
const PIN_CODE = import.meta.env.VITE_PIN_CODE;

function DealerRefill({ setMessage }) {
  const [refillDate, setRefillDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [refills, setRefills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('normal'); // 'normal' or 'exchange'
  
  // Values for each cylinder type
  const [lokpriya, setLokpriya] = useState({ give: 0, take: 0 });
  const [sugam, setSugam] = useState({ give: 0, take: 0 });
  const [everest, setEverest] = useState({ give: 0, take: 0 });
  const [other, setOther] = useState({ give: 0, take: 0 });
  
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
        // Normal mode: Give = Filled, Take = Empty
        sendData = {
          refillDate,
          lokpriyaFilled: lokpriya.give,
          lokpriyaEmpty: lokpriya.take,
          sugamFilled: sugam.give,
          sugamEmpty: sugam.take,
          everestFilled: everest.give,
          everestEmpty: everest.take,
          otherFilled: other.give,
          otherEmpty: other.take,
          notes,
          mode: 'normal'
        };
      } else {
        // Exchange mode: Give = Empty given by dealer, Take = Empty taken by dealer
        sendData = {
          refillDate,
          lokpriyaFilled: 0,
          lokpriyaEmpty: lokpriya.take,  // Dealer takes empty
          sugamFilled: 0,
          sugamEmpty: sugam.take,
          everestFilled: 0,
          everestEmpty: everest.take,
          otherFilled: 0,
          otherEmpty: other.take,
          notes: notes ? `[EXCHANGE] ${notes}` : '[EXCHANGE] Empty exchange',
          mode: 'exchange',
          // Store what dealer gave separately
          exchange_give_lokpriya: lokpriya.give,
          exchange_give_sugam: sugam.give,
          exchange_give_everest: everest.give,
          exchange_give_other: other.give
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
        setMessage(mode === 'normal' ? '✅ रिफिल सुरक्षित गरियो' : '✅ खाली साटासाट सुरक्षित गरियो');
        // Reset all values
        setLokpriya({ give: 0, take: 0 });
        setSugam({ give: 0, take: 0 });
        setEverest({ give: 0, take: 0 });
        setOther({ give: 0, take: 0 });
        setNotes('');
        loadRefillHistory();
      } else {
        setMessage('❌ ' + data.message);
      }
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Save error:', error);
      setMessage('❌ इन्टरनेट जडान जाँच गर्नुहोस्');
      setTimeout(() => setMessage(''), 3000);
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

  // Cylinder data for mapping
  const cylinders = [
    { key: 'lokpriya', name: 'लोकप्रिय', icon: '🟦', state: lokpriya, setState: setLokpriya },
    { key: 'sugam', name: 'सुगम', icon: '🟩', state: sugam, setState: setSugam },
    { key: 'everest', name: 'एभरेस्ट', icon: '🟧', state: everest, setState: setEverest },
    { key: 'other', name: 'अन्य', icon: '🟪', state: other, setState: setOther }
  ];

  return (
    <div className="bg-white rounded-2xl p-5 shadow-md">
      <h2 className="text-xl font-bold text-blue-900 border-l-4 border-orange-500 pl-3 mb-4">
        🚚 डिलर रिफिल
      </h2>

      {/* Mode Selection - Better UI */}
      <div className="mb-4">
        <label className="block font-semibold mb-2 text-lg">📋 रिफिल प्रकार / Refill Type</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setMode('normal')}
            className={`py-3 rounded-xl font-semibold transition ${
              mode === 'normal'
                ? 'bg-blue-900 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 border border-gray-300'
            }`}
          >
            <div className="text-lg">🔄 सामान्य रिफिल</div>
            <div className="text-xs opacity-80">Normal Refill</div>
          </button>
          <button
            onClick={() => setMode('exchange')}
            className={`py-3 rounded-xl font-semibold transition ${
              mode === 'exchange'
                ? 'bg-blue-900 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 border border-gray-300'
            }`}
          >
            <div className="text-lg">🔁 खाली साटासाट</div>
            <div className="text-xs opacity-80">Empty Exchange</div>
          </button>
        </div>
      </div>

      {/* Instructions based on mode */}
      <div className={`p-3 rounded-xl mb-4 text-sm ${
        mode === 'normal' ? 'bg-green-50 border border-green-200' : 'bg-purple-50 border border-purple-200'
      }`}>
        {mode === 'normal' ? (
          <>
            <p className="font-bold mb-1">📌 सामान्य रिफिल (Normal Refill):</p>
            <p>• <span className="text-green-600 font-medium">दियो (Give)</span> → डिलरले दिएको <strong>भरिएको</strong> सिलिन्डर</p>
            <p>• <span className="text-red-600 font-medium">लग्यो (Take)</span> → डिलरले लगेको <strong>खाली</strong> सिलिन्डर</p>
          </>
        ) : (
          <>
            <p className="font-bold mb-1">📌 खाली साटासाट (Empty Exchange):</p>
            <p>• <span className="text-green-600 font-medium">दियो (Give)</span> → डिलरले दिएको <strong>खाली</strong> सिलिन्डर</p>
            <p>• <span className="text-red-600 font-medium">लग्यो (Take)</span> → डिलरले लगेको <strong>खाली</strong> सिलिन्डर</p>
          </>
        )}
      </div>

      <div className="mb-4">
        <label className="block font-semibold mb-2 text-lg">📅 मिति / Date</label>
        <input
          type="date"
          value={refillDate}
          onChange={(e) => setRefillDate(e.target.value)}
          className="w-full p-4 border-2 border-gray-300 rounded-xl text-lg focus:border-blue-500 focus:outline-none"
        />
      </div>

      {/* Cylinder Input Sections */}
      {cylinders.map(cyl => (
        <div key={cyl.key} className="bg-gray-50 rounded-xl p-4 mb-4">
          <div className="font-bold text-lg mb-3">{cyl.icon} {cyl.name}</div>
          
          <div className="grid grid-cols-2 gap-4">
            {/* Give Column */}
            <div>
              <label className="block text-sm font-medium mb-1 text-green-600">
                📤 दियो / Give
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={formatValue(cyl.state.give)}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  const num = val === '' ? 0 : parseInt(val, 10);
                  if (num >= 0 && num <= 999) {
                    cyl.setState({ ...cyl.state, give: num });
                  }
                }}
                className="w-full p-4 text-xl font-bold border-2 border-green-300 rounded-xl focus:border-green-500 focus:outline-none text-center"
                placeholder="०"
              />
            </div>
            
            {/* Take Column */}
            <div>
              <label className="block text-sm font-medium mb-1 text-red-600">
                📥 लग्यो / Take
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={formatValue(cyl.state.take)}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  const num = val === '' ? 0 : parseInt(val, 10);
                  if (num >= 0 && num <= 999) {
                    cyl.setState({ ...cyl.state, take: num });
                  }
                }}
                className="w-full p-4 text-xl font-bold border-2 border-red-300 rounded-xl focus:border-red-500 focus:outline-none text-center"
                placeholder="०"
              />
            </div>
          </div>
        </div>
      ))}

      {/* Example based on mode */}
      <div className="bg-blue-50 p-3 rounded-xl mb-4 text-sm">
        <p className="font-bold mb-1">📌 उदाहरण / Example:</p>
        {mode === 'normal' ? (
          <>
            <p>डिलरले ८ लोकप्रिय <strong>भरिएको</strong> दियो र ५ <strong>खाली</strong> लग्यो भने:</p>
            <p className="mt-1">• लोकप्रिय: दियो = 8, लग्यो = 5</p>
          </>
        ) : (
          <>
            <p>डिलरले ३ लोकप्रिय <strong>खाली</strong> दियो र ५ अन्य <strong>खाली</strong> लग्यो भने:</p>
            <p className="mt-1">• लोकप्रिय: दियो = 3</p>
            <p>• अन्य: लग्यो = 5</p>
          </>
        )}
      </div>

      <div className="mb-4">
        <label className="block font-semibold mb-2 text-lg">📝 नोट / Notes</label>
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
        {loading ? 'सेभ गर्दै...' : '✅ रिफिल सुरक्षित गर्नुहोस् / Save Refill'}
      </button>

      <hr className="my-5" />

      <h3 className="font-bold text-lg mb-3">📜 रिफिल इतिहास / Refill History</h3>
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
                <div className="text-xs text-purple-600 mt-1">🔄 खाली साटासाट / Empty Exchange</div>
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