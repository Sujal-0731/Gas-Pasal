import React, { useState, useEffect, useRef } from 'react';
import { 
  IconQueue, 
  IconPlus, 
  IconUsers, 
  IconClock, 
  IconTrash,
  IconCheck,
  IconSearch,
  IconX,
  IconFilledCylinder,
  IconEmptyCylinder
} from '../components/icons';

const API_URL = import.meta.env.VITE_API_URL;
const PIN_CODE = import.meta.env.VITE_PIN_CODE;

const cylinderOptions = ['लोकप्रिय', 'सुगम', 'एभरेस्ट', 'अन्य / Other'];

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
      if (showToast) showToast('क्यू लोड गर्न असफल', 'error');
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
      if (showToast) showToast('कृपया ग्राहक चयन गर्नुहोस्', 'error');
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
        if (showToast) showToast('ग्राहक क्यूमा थपियो', 'success');
        setShowAddModal(false);
        setSelectedCustomer(null);
        setEmptyCylinder('लोकप्रिय');
        setNotes('');
        setSearchTerm('');
        await loadQueue();
      } else {
        if (showToast) showToast(data.message, 'error');
      }
    } catch (error) {
      console.error('Add to queue error:', error);
      if (showToast) showToast('इन्टरनेट जडान जाँच गर्नुहोस्', 'error');
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
          if (showToast) showToast(`${customerName} क्यूबाट हटाइयो`, 'success');
          setQueue(prevQueue => prevQueue.filter(q => q.id !== queueId));
          await loadQueue();
        } else {
          if (showToast) showToast(data.message, 'error');
        }
      } catch (error) {
        console.error('Remove from queue error:', error);
        if (showToast) showToast('इन्टरनेट जडान जाँच गर्नुहोस्', 'error');
      }
      setLoading(false);
    }
  };

  const handleSelectFromQueue = (item) => {
    setProcessingId(item.id);
    setQueue(prevQueue => prevQueue.filter(q => q.id !== item.id));
    onSelectCustomerFromQueue(item);
    if (showToast) showToast(`${item.customer_name} चयन गरियो`, 'success');
    
    setTimeout(() => {
      setProcessingId(null);
      loadQueue();
    }, 500);
  };

  const handleSelectCustomer = (customer) => {
    setSelectedCustomer(customer);
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
    
    if (diffMins < 60) return `${diffMins} मिनेट पहिले`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} घण्टा पहिले`;
    return `${Math.floor(diffMins / 1440)} दिन पहिले`;
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
    <div className="space-y-5">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        {/* Header Section */}
        <div className="p-4 bg-gradient-to-r from-blue-700 to-blue-500 border-b">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-white">पर्खने सूची</h2>
              <p className="text-blue-50 text-base mt-1">ग्राहक पर्खाइ व्यवस्थापन</p>
            </div>
            <button
              onClick={openModal}
              className="bg-white/20 hover:bg-white/30 text-white px-5 py-2 rounded-xl text-base font-bold transition-colors flex items-center gap-2"
            >
              <IconPlus className="w-5 h-5" />
              नयाँ
            </button>
          </div>
        </div>

        <div className="p-5">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : queue.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <IconQueue className="w-20 h-20 mx-auto mb-4 opacity-30" />
              <p className="text-xl font-bold text-gray-500">क्यू खाली छ</p>
              <p className="text-base mt-1">कुनै ग्राहक पर्खिरहेको छैन</p>
            </div>
          ) : (
            <>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {queue.map((item) => (
                  <div
                    key={item.id}
                    className={`bg-gray-50 rounded-xl p-4 border-l-4 transition-all ${
                      processingId === item.id 
                        ? 'border-green-500 bg-green-50 opacity-50' 
                        : 'border-gray-500 hover:shadow-xl hover:bg-gray-100 cursor-pointer'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <IconUsers className="w-5 h-5 text-gray-500" />
                          <span className="font-bold text-lg text-gray-900">{item.customer_name}</span>
                        </div>
                        <div className="text-base text-gray-700 mb-2 flex items-center gap-2 font-semibold">
                          <IconEmptyCylinder className="w-5 h-5 text-red-500" />
                          खाली: {item.empty_cylinder}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <IconClock className="w-4 h-4" />
                          <span>{getWaitingTime(item.queued_at)}</span>
                        </div>
                        {item.notes && (
                          <div className="text-sm text-gray-600 mt-2 p-2 bg-white rounded-lg">
                            {item.notes}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 ml-4">
                        <button
                          onClick={() => handleSelectFromQueue(item)}
                          disabled={processingId === item.id}
                          className={`px-5 py-2 rounded-xl text-base font-bold transition ${
                            processingId === item.id
                              ? 'bg-gray-400 text-white cursor-not-allowed'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                        >
                          {processingId === item.id ? 'प्रोसेसिङ...' : 'लेनदेन'}
                        </button>
                        <button
                          onClick={() => removeFromQueue(item.id, item.customer_name)}
                          disabled={processingId === item.id}
                          className="px-5 py-2 rounded-xl text-base font-semibold bg-red-500 text-white hover:bg-red-600 transition disabled:opacity-50"
                        >
                          हटाउनुहोस्
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 p-4 bg-gray-50 rounded-xl text-center border border-gray-1000">
                <span className="text-base font-bold text-black-500">
                  क्यूमा {queue.length} जना ग्राहक पर्खिरहेका छन्
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Add to Queue Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-gradient-to-r from-blue-700 to-blue-500 p-5">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold text-white">क्यूमा ग्राहक थप्नुहोस्</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <IconX className="w-6 h-6 text-white" />
                </button>
              </div>
            </div>

            <div className="p-5">
              <div className="mb-5">
                <label className="block text-lg font-bold text-gray-800 mb-2">ग्राहक खोज्नुहोस्</label>
                <div className="relative">
                  <IconSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    ref={modalSearchRef}
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="नाम लेख्नुहोस्..."
                    className="w-full pl-11 pr-4 py-3 text-lg border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all font-semibold"
                    autoFocus
                  />
                </div>
              </div>

              {searchTerm.length > 0 && !selectedCustomer && (
                <div className="mb-5 max-h-60 overflow-y-auto border-2 border-gray-200 rounded-xl">
                  {filteredCustomers.length === 0 ? (
                    <div className="text-center text-gray-500 py-6 text-base font-medium">कोही ग्राहक छैन</div>
                  ) : (
                    filteredCustomers.map(customer => (
                      <div
                        key={customer.id}
                        onClick={() => handleSelectCustomer(customer)}
                        className="p-4 border-b cursor-pointer hover:bg-blue-50 transition"
                      >
                        <div className="font-bold text-lg text-gray-900">{customer.name}</div>
                        <div className="text-base text-gray-600 mt-1">{customer.phone || 'नम्बर छैन'}</div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {selectedCustomer && (
                <div className="mb-5 p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <div className="text-sm font-bold text-blue-700 mb-2">चयन गरिएको ग्राहक</div>
                  <div className="font-bold text-xl text-gray-900">{selectedCustomer.name}</div>
                  <button
                    onClick={() => {
                      setSelectedCustomer(null);
                      setSearchTerm('');
                    }}
                    className="mt-2 text-sm font-semibold text-red-500 hover:text-red-700"
                  >
                    परिवर्तन गर्नुहोस्
                  </button>
                </div>
              )}

              {selectedCustomer && (
                <>
                  <div className="mb-5">
                    <label className="block text-lg font-bold text-gray-800 mb-2">खाली सिलिन्डर</label>
                    <div className="relative">
                      <select
                        value={emptyCylinder}
                        onChange={(e) => setEmptyCylinder(e.target.value)}
                        className="w-full p-3 text-lg font-bold border-2 border-gray-300 rounded-xl focus:border-blue-500 outline-none transition-colors appearance-none bg-white shadow-sm pr-12"
                      >
                        {cylinderOptions.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="mb-5">
                    <label className="block text-lg font-bold text-gray-800 mb-2">नोट (वैकल्पिक)</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows="2"
                      placeholder="जस्तै: रु.२०० बाँकी"
                      className="w-full p-3 text-base border-2 border-gray-300 rounded-xl focus:border-blue-500 outline-none transition-all resize-none font-semibold"
                    />
                  </div>
                </>
              )}

              <div className="flex gap-3 mt-6">
                <button
                  onClick={addToQueue}
                  disabled={!selectedCustomer || isAdding}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold text-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isAdding ? (
                    <>
                      <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
                      थप्दै...
                    </>
                  ) : (
                    <>
                      <IconCheck className="w-5 h-5" />
                      ग्राहक थप्नुहोस्
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setSelectedCustomer(null);
                    setSearchTerm('');
                  }}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-4 rounded-xl font-bold text-lg transition"
                >
                  रद्द गर्नुहोस्
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Queue;