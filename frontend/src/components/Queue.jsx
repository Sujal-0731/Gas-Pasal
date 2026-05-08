import React, { useState, useEffect, useRef } from 'react';

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
  const [processingId, setProcessingId] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const queueListRef = useRef(null);
  const modalSearchRef = useRef(null);

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
      if (showToast) showToast('❌ क्यू लोड गर्न असफल', 'error');
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
      if (showToast) showToast('❌ कृपया ग्राहक चयन गर्नुहोस्', 'error');
      return;
    }

    setIsAdding(true);
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
        if (showToast) showToast('✅ ग्राहक क्यूमा थपियो', 'success');
        setShowAddModal(false);
        setSelectedCustomer(null);
        setEmptyCylinder('लोकप्रिय');
        setNotes('');
        setSearchTerm('');
        await loadQueue();
      } else {
        if (showToast) showToast(`❌ ${data.message}`, 'error');
      }
    } catch (error) {
      console.error('Add to queue error:', error);
      if (showToast) showToast('❌ इन्टरनेट जडान जाँच गर्नुहोस्', 'error');
    }
    setIsAdding(false);
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
          if (showToast) showToast(`✅ ${customerName} क्यूबाट हटाइयो`, 'success');
          setQueue(prevQueue => prevQueue.filter(q => q.id !== queueId));
          await loadQueue();
        } else {
          if (showToast) showToast(`❌ ${data.message}`, 'error');
        }
      } catch (error) {
        console.error('Remove from queue error:', error);
        if (showToast) showToast('❌ इन्टरनेट जडान जाँच गर्नुहोस्', 'error');
      }
      setLoading(false);
    }
  };

  const handleSelectFromQueue = (item) => {
    setProcessingId(item.id);
    setQueue(prevQueue => prevQueue.filter(q => q.id !== item.id));
    onSelectCustomerFromQueue(item);
    if (showToast) showToast(`✅ ${item.customer_name} चयन गरियो। कृपया लेनदेन पूरा गर्नुहोस्।`, 'success');
    
    setTimeout(() => {
      setProcessingId(null);
      loadQueue();
    }, 500);
  };

  // Function to select customer and clear search results
  const handleSelectCustomer = (customer) => {
    setSelectedCustomer(customer);
    // Clear search term to hide the search results list
    setSearchTerm('');
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

  const openModal = () => {
    setShowAddModal(true);
    setSelectedCustomer(null);
    setSearchTerm('');
    setTimeout(() => {
      if (modalSearchRef.current) {
        modalSearchRef.current.focus();
      }
    }, 100);
  };

  return (
    <div className="bg-white rounded-2xl p-5 shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-blue-900 border-l-4 border-orange-500 pl-3">
          📋 पर्खने सूची / Queue
        </h2>
        <button
          onClick={openModal}
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
        <>
          <div className="space-y-3 max-h-96 overflow-y-auto" ref={queueListRef}>
            {queue.map((item) => (
              <div
                key={item.id}
                className={`bg-gray-50 p-4 rounded-xl border-l-4 transition-all duration-300 ${
                  processingId === item.id 
                    ? 'border-green-500 bg-green-50 opacity-50' 
                    : 'border-orange-500'
                }`}
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
                      onClick={() => handleSelectFromQueue(item)}
                      disabled={processingId === item.id}
                      className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                        processingId === item.id
                          ? 'bg-gray-400 text-white cursor-not-allowed'
                          : 'bg-blue-900 text-white hover:bg-blue-800'
                      }`}
                    >
                      {processingId === item.id ? '⏳ प्रोसेसिङ...' : 'लेनदेन'}
                    </button>
                    <button
                      onClick={() => removeFromQueue(item.id, item.customer_name)}
                      disabled={processingId === item.id}
                      className="bg-red-500 text-white px-4 py-2 rounded-full text-sm hover:bg-red-600 transition disabled:opacity-50"
                    >
                      हटाउनुहोस्
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 p-2 bg-orange-100 rounded-lg text-center">
            <span className="text-sm text-orange-700">
              📊 क्यूमा {queue.length} जना ग्राहक पर्खिरहेका छन्
            </span>
          </div>
        </>
      )}

      {/* Add to Queue Modal - FIXED VERSION */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4 text-blue-900">क्यूमा ग्राहक थप्नुहोस्</h3>
            
            <div className="mb-4">
              <label className="block font-semibold mb-2 text-gray-700">🔍 ग्राहक खोज्नुहोस्</label>
              <input
                ref={modalSearchRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="नाम लेख्नुहोस्..."
                className="w-full p-3 border border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
                autoFocus
              />
            </div>

            {/* Search Results - Only show when searching and no customer selected */}
            {searchTerm.length > 0 && !selectedCustomer && (
              <div className="mb-4 max-h-52 overflow-y-auto border border-gray-200 rounded-xl">
                {filteredCustomers.length === 0 ? (
                  <div className="text-center text-gray-500 py-4">कोही ग्राहक छैन</div>
                ) : (
                  filteredCustomers.map(customer => (
                    <div
                      key={customer.id}
                      onClick={() => handleSelectCustomer(customer)}
                      className="p-3 border-b cursor-pointer hover:bg-gray-50 transition"
                    >
                      <div className="font-semibold">{customer.name}</div>
                      <div className="text-sm text-gray-500">📞 {customer.phone || 'नम्बर छैन'}</div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Selected Customer Display */}
            {selectedCustomer && (
              <div className="mb-4 p-3 bg-blue-50 rounded-xl">
                <div className="text-sm text-blue-600 mb-2">✅ चयन गरिएको ग्राहक:</div>
                <div className="font-bold text-lg">{selectedCustomer.name}</div>
                <button
                  onClick={() => {
                    setSelectedCustomer(null);
                    setSearchTerm('');
                  }}
                  className="mt-2 text-sm text-red-500 hover:text-red-700"
                >
                  परिवर्तन गर्नुहोस्
                </button>
              </div>
            )}

            {selectedCustomer && (
              <>
                <div className="mb-4">
                  <label className="block font-semibold mb-2 text-gray-700">🔄 खाली सिलिन्डर</label>
                  <select
                    value={emptyCylinder}
                    onChange={(e) => setEmptyCylinder(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
                  >
                    <option value="लोकप्रिय">लोकप्रिय / Lokpriya</option>
                    <option value="सुगम">सुगम / Sugam</option>
                    <option value="एभरेस्ट">एभरेस्ट / Everest</option>
                    <option value="अन्य / Other">अन्य / Other</option>
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block font-semibold mb-2 text-gray-700">📝 नोट (वैकल्पिक)</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows="2"
                    placeholder="जस्तै: रु.२०० बाँकी"
                    className="w-full p-3 border border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </>
            )}

            <div className="flex gap-3 mt-4">
              <button
                onClick={addToQueue}
                disabled={!selectedCustomer || isAdding}
                className="flex-1 bg-blue-900 text-white py-3 rounded-full font-semibold hover:bg-blue-800 transition disabled:opacity-50"
              >
                {isAdding ? '✅ थप्दै...' : '✅ ग्राहक थप्नुहोस्'}
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