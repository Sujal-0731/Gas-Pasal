import React, { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL;
const PIN_CODE = import.meta.env.VITE_PIN_CODE;

function Queue({ showToast, onSelectCustomerFromQueue }) {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [emptyCylinder, setEmptyCylinder] = useState('लोकप्रिय');
  const [notes, setNotes] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadQueue();
    loadCustomers();
  }, []);

  const loadQueue = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/queue`, {
        headers: { 'x-pin': PIN_CODE }
      });
      const data = await res.json();
      if (data.success) {
        setQueue(data.queue);
      }
    } catch (error) {
      console.error('Error loading queue:', error);
      showToast('क्यू लोड गर्न असफल', 'error');
    }
    setLoading(false);
  };

  const loadCustomers = async () => {
    try {
      const res = await fetch(`${API_URL}/customers`, {
        headers: { 'x-pin': PIN_CODE }
      });
      const data = await res.json();
      if (data.success) {
        setCustomers(data.data);
      }
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  };

  const addToQueue = async () => {
    if (!selectedCustomer) {
      showToast('कृपया ग्राहक चयन गर्नुहोस्', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/queue`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-pin': PIN_CODE
        },
        body: JSON.stringify({
          customerId: selectedCustomer.id,
          customerName: selectedCustomer.name,
          emptyCylinder,
          notes
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast('ग्राहक क्यूमा थपियो', 'success');
        setShowAddModal(false);
        setSelectedCustomer(null);
        setEmptyCylinder('लोकप्रिय');
        setNotes('');
        setSearchTerm('');
        loadQueue();
      } else {
        showToast(`${data.message}`, 'error');
      }
    } catch (error) {
      console.error('Add to queue error:', error);
      showToast('इन्टरनेट जडान जाँच गर्नुहोस्', 'error');
    }
    setLoading(false);
  };

  const removeFromQueue = async (queueId, customerName) => {
    if (window.confirm(`के तपाईं ${customerName} लाई क्यूबाट हटाउन चाहनुहुन्छ?`)) {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/queue/${queueId}`, {
          method: 'DELETE',
          headers: { 'x-pin': PIN_CODE }
        });
        const data = await res.json();
        if (data.success) {
          showToast(`${customerName} क्यूबाट हटाइयो`, 'success');
          loadQueue();
        } else {
          showToast(`${data.message}`, 'error');
        }
      } catch (error) {
        console.error('Remove from queue error:', error);
        showToast('इन्टरनेट जडान जाँच गर्नुहोस्', 'error');
      }
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getWaitingTime = (queuedAt) => {
    const queued = new Date(queuedAt);
    const now = new Date();
    const diffMs = now - queued;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) {
      return `${diffMins} मिनेट पहिले`;
    } else if (diffMins < 1440) {
      return `${Math.floor(diffMins / 60)} घण्टा पहिले`;
    } else {
      return `${Math.floor(diffMins / 1440)} दिन पहिले`;
    }
  };

  return (
    <div className="bg-white rounded-2xl p-5 shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-blue-900 border-l-4 border-orange-500 pl-3">
          📋 पर्खने सूची / Queue
        </h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-green-700 transition"
        >
          + नयाँ
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">⏳ लोड हुँदै...</div>
      ) : queue.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          📭 क्यूमा कोही छैन
          <br />
          <span className="text-sm">क्यू खाली छ</span>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {queue.map((item) => (
            <div
              key={item.id}
              className="bg-gray-50 p-4 rounded-xl border-l-4 border-orange-500"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="font-bold text-lg">👤 {item.customer_name}</div>
                  <div className="text-sm text-gray-600 mt-1">
                    📤 खाली: {item.empty_cylinder}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    ⏰ {getWaitingTime(item.queued_at)}
                  </div>
                  {item.notes && (
                    <div className="text-xs text-gray-500 mt-1">📝 {item.notes}</div>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => onSelectCustomerFromQueue(item)}
                    className="bg-blue-900 text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-blue-800 transition"
                  >
                    लेनदेन
                  </button>
                  <button
                    onClick={() => removeFromQueue(item.id, item.customer_name)}
                    className="bg-red-500 text-white px-4 py-2 rounded-full text-sm hover:bg-red-600 transition"
                  >
                    हटाउनुहोस्
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add to Queue Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-96 overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">क्यूमा थप्नुहोस्</h3>
            
            <div className="mb-4">
              <label className="block font-semibold mb-2">🔍 ग्राहक खोज्नुहोस्</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="नाम लेख्नुहोस्..."
                className="w-full p-3 border rounded-xl focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="mb-4 max-h-48 overflow-y-auto">
              {filteredCustomers.map(customer => (
                <div
                  key={customer.id}
                  onClick={() => setSelectedCustomer(customer)}
                  className={`p-3 rounded-xl mb-2 cursor-pointer transition ${
                    selectedCustomer?.id === customer.id
                      ? 'bg-blue-100 border-blue-500 border'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  <div className="font-bold">{customer.name}</div>
                  <div className="text-sm text-gray-600">📞 {customer.phone || 'नम्बर छैन'}</div>
                </div>
              ))}
              {filteredCustomers.length === 0 && (
                <div className="text-center text-gray-500 py-4">कोही ग्राहक छैन</div>
              )}
            </div>

            {selectedCustomer && (
              <>
                <div className="mb-4">
                  <label className="block font-semibold mb-2">🔄 खाली सिलिन्डर</label>
                  <select
                    value={emptyCylinder}
                    onChange={(e) => setEmptyCylinder(e.target.value)}
                    className="w-full p-3 border rounded-xl focus:border-blue-500 focus:outline-none"
                  >
                    <option>लोकप्रिय</option>
                    <option>सुगम</option>
                    <option>एभरेस्ट</option>
                    <option>अन्य / Other</option>
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block font-semibold mb-2">📝 नोट (वैकल्पिक)</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows="2"
                    placeholder="जस्तै: रु.२०० बाँकी"
                    className="w-full p-3 border rounded-xl focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </>
            )}

            <div className="flex gap-3">
              <button
                onClick={addToQueue}
                disabled={!selectedCustomer}
                className="flex-1 bg-blue-900 text-white py-3 rounded-full font-semibold hover:bg-blue-800 transition disabled:opacity-50"
              >
                ✅ थप्नुहोस्
              </button>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setSelectedCustomer(null);
                  setSearchTerm('');
                }}
                className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-full font-semibold hover:bg-gray-400 transition"
              >
                रद्द गर्नुहोस्
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Queue;