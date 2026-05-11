import { useState, useEffect, useCallback } from 'react';
import { 
  IconSearch, 
  IconPhone, 
  IconCopy, 
  IconChevronLeft,
  IconFilledCylinder,
  IconEmptyCylinder,
  IconQueue,
  IconAlertCircle,
  IconUsers,
  IconEdit,
  IconRefresh
} from '../components/icons';
import { useLanguage } from '../context/LanguageContext';
import { t } from '../utils/translations';
import { translateCylinder } from '../utils/cylinderTranslator';
import EditCustomerModal from '../components/admin/EditCustomerModal';

const API_URL = import.meta.env.VITE_API_URL;

function CustomerHistory({ showToast, user }) {
  const { language } = useLanguage();
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showCustomerEditModal, setShowCustomerEditModal] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState(null);

  const isAdmin = user?.role === 'admin';

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/customers`, {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        setCustomers(data.data || []);
      }
    } catch {
      console.error('Error loading customers');
      if (showToast) showToast(t('error', language), 'error');
    }
    setLoading(false);
  }, [showToast, language]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const makePhoneCall = (phoneNumber) => {
    if (!phoneNumber) {
      if (showToast) showToast(t('phoneNotAvailable', language), 'error');
      return;
    }
    window.open(`tel:${phoneNumber}`, '_blank');
  };

  const copyPhoneNumber = async (phoneNumber) => {
    if (!phoneNumber) return;
    try {
      await navigator.clipboard.writeText(phoneNumber);
      if (showToast) showToast(`${phoneNumber} ${t('copied', language)}`, 'success');
    } catch {
      if (showToast) showToast(t('copyFailed', language), 'error');
    }
  };

  const filteredCustomers = customers.filter(c => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    const nameMatch = c.name?.toLowerCase().includes(searchLower);
    const phoneMatch = c.phone && c.phone.includes(searchTerm);
    return nameMatch || phoneMatch;
  });

  const viewHistory = async (customer) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/customers/${encodeURIComponent(customer.name)}/history`, {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        setSelectedCustomer(customer);
        setHistory(data);
      }
    } catch {
      console.error('Error loading history');
      if (showToast) showToast(t('error', language), 'error');
    }
    setLoading(false);
  };

  const handleEditClick = () => {
    if (history?.customer) {
      setCustomerToEdit(history.customer);
      setShowCustomerEditModal(true);
    }
  };

  const handleCustomerUpdated = useCallback(async (updatedCustomerData) => {
    await loadCustomers();
    
    if (updatedCustomerData && selectedCustomer) {
      setSelectedCustomer(updatedCustomerData);
      try {
        const response = await fetch(`${API_URL}/customers/${encodeURIComponent(updatedCustomerData.name)}/history`, {
          credentials: 'include'
        });
        const data = await response.json();
        if (data.success) {
          setHistory(data);
        } else {
          if (showToast) showToast(t('error', language), 'error');
        }
      } catch {
        console.error('Error refreshing history');
        if (showToast) showToast(t('networkError', language), 'error');
      }
    } else if (selectedCustomer) {
      await viewHistory(selectedCustomer);
    }
  }, [loadCustomers, selectedCustomer, showToast, language]);

  if (selectedCustomer) {
    return (
      <div className="space-y-5 pb-24">
        <button
          onClick={() => { setSelectedCustomer(null); setHistory(null); }}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors font-medium"
        >
          <IconChevronLeft className="w-5 h-5" />
          <span>{t('allCustomers', language)}</span>
        </button>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-700 to-blue-500 px-6 py-5">
            <div className="flex justify-between items-center flex-wrap gap-3">
              <h3 className="text-white font-bold text-xl">{t('customerDetails', language)}</h3>
              <div className="flex gap-2">
                {history?.customer?.phone && (
                  <button
                    onClick={() => makePhoneCall(history.customer.phone)}
                    className="bg-white/20 hover:bg-white/30 text-white px-4 py-1.5 rounded-full text-sm font-semibold transition-colors flex items-center gap-2"
                  >
                    <IconPhone className="w-4 h-4" />
                    {t('call', language)}
                  </button>
                )}
                {isAdmin && (
                  <button
                    onClick={handleEditClick}
                    className="bg-white/20 hover:bg-white/30 text-white px-4 py-1.5 rounded-full text-sm font-semibold transition-colors flex items-center gap-2"
                  >
                    <IconEdit className="w-4 h-4" />
                    {t('edit', language)}
                  </button>
                )}
              </div>
            </div>
          </div>
          
          <div className="p-6 space-y-4">
            <div className="flex flex-wrap justify-between items-start gap-4">
              <div className="flex-1">
                <p className="text-gray-500 text-sm mb-1">{t('name', language)}</p>
                <p className="text-gray-900 font-semibold text-lg">{history?.customer?.name || '—'}</p>
              </div>
              {history?.customer?.phone && (
                <div>
                  <p className="text-gray-500 text-sm mb-1">{t('phone', language)}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-gray-900 font-semibold">{history.customer.phone}</p>
                    <button
                      onClick={() => copyPhoneNumber(history.customer.phone)}
                      className="p-1 hover:bg-gray-100 rounded transition-colors"
                      title={t('copy', language)}
                    >
                      <IconCopy className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {history?.customer?.address && (
              <div>
                <p className="text-gray-500 text-sm mb-1">{t('address', language)}</p>
                <p className="text-gray-900 font-medium">{history.customer.address}</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white text-center py-4 rounded-xl font-bold text-xl">
          {t('totalTransactions', language)}: {history?.totalExchanges || 0}
        </div>

        {history?.transactions?.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center text-gray-400">
            <IconAlertCircle className="w-14 h-14 mx-auto mb-3 opacity-50" />
            <p className="text-lg font-medium">{t('noTransactions', language)}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {history?.transactions?.map((transaction, idx) => (
              <div key={idx} className="bg-white rounded-xl p-5 shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900 text-base">{transaction.date}</span>
                    <span className="text-sm text-gray-500">| {transaction.time}</span>
                  </div>
                  {transaction.source === 'queue' && (
                    <span className="bg-purple-100 text-purple-700 text-sm px-3 py-1.5 rounded-full flex items-center gap-1 font-semibold">
                      <IconQueue className="w-4 h-4" />
                      {t('fromQueue', language)}
                    </span>
                  )}
                </div>
                
                {transaction.source === 'queue' && transaction.queue_date_formatted && (
                  <div className="text-sm text-blue-600 mb-3 flex items-center gap-1 font-medium">
                    <span>{t('addedToQueue', language)}: {transaction.queue_date_formatted} {transaction.queue_time_formatted ? `| ${transaction.queue_time_formatted}` : ''}</span>
                  </div>
                )}
                
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <IconEmptyCylinder className="w-5 h-5 text-red-500" />
                    <span className="text-base font-semibold text-gray-800">
                      {transaction.empty_cylinder === 'कोही छैन' 
                        ? t('newPurchase', language) 
                        : translateCylinder(transaction.empty_cylinder, language)}
                    </span>
                  </div>
                  <span className="text-gray-400 text-xl font-bold">→</span>
                  <div className="flex items-center gap-2">
                    <IconFilledCylinder className="w-5 h-5 text-green-600" />
                    <span className="text-base font-bold text-green-700">
                      {transaction.filled_cylinder === 'कोही छैन' 
                        ? t('return', language) 
                        : translateCylinder(transaction.filled_cylinder, language)}
                    </span>
                  </div>
                </div>
                
                {transaction.remarks && (
                  <div className="mt-3 text-sm text-gray-500 pt-2 border-t border-gray-100 font-medium">
                    {transaction.remarks}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {showCustomerEditModal && customerToEdit && (
          <EditCustomerModal
            customer={customerToEdit}
            onClose={() => {
              setShowCustomerEditModal(false);
              setCustomerToEdit(null);
            }}
            onSuccess={handleCustomerUpdated}
            showToast={showToast}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-24">
      <div className="bg-gradient-to-r from-blue-700 to-blue-500 rounded-2xl p-6 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <IconUsers className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">{t('customerHistory', language)}</h1>
            <p className="text-blue-100 text-base mt-1">{t('searchCustomer', language)}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
        <div className="p-6">
          <div className="relative">
            <IconSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('searchNameOrPhone', language)}
              className="w-full pl-12 pr-4 py-4 text-lg border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all font-medium"
            />
          </div>
          <p className="text-xs text-gray-400 mt-2">
            💡 {t('searchTip', language)}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-500">{t('loading', language)}...</p>
          </div>
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-8 text-center">
          <IconAlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-500">{t('noCustomers', language)}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredCustomers.map(customer => (
            <div
              key={customer.id}
              onClick={() => viewHistory(customer)}
              className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-bold text-gray-900 text-lg group-hover:text-blue-600 transition-colors">
                    {customer.name}
                  </p>
                  <p className="text-base text-gray-600 mt-1 font-medium">
                    {customer.phone ? `📱 ${customer.phone}` : '📞 ' + t('noPhone', language)}
                  </p>
                  {customer.address && (
                    <p className="text-sm text-gray-400 mt-0.5">
                      📍 {customer.address}
                    </p>
                  )}
                </div>
                {customer.phone && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      makePhoneCall(customer.phone);
                    }}
                    className="p-3 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
                    title={t('call', language)}
                  >
                    <IconPhone className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={loadCustomers}
        className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
      >
        <IconRefresh className="w-5 h-5" />
        {t('refresh', language)}
      </button>
    </div>
  );
}

export default CustomerHistory;