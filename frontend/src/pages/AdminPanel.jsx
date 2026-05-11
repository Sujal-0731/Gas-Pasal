import React, { useState, useEffect } from 'react';
import { 
  IconUsers, 
  IconPlus, 
  IconEdit, 
  IconTrash, 
  IconKey,
  IconCheck,
  IconX,
  IconRefresh,
  IconAlertCircle,
  IconUserPlus,
  IconUserCheck,
  IconDashboard,
  IconSettings,
  IconPackage,
  IconSearch
} from '../components/icons';
import { useLanguage } from '../context/LanguageContext';
import { t } from '../utils/translations';
import EditUserModal from '../components/admin/EditUserModal';
import EditCustomerModal from '../components/admin/EditCustomerModal';
import EditStockModal from '../components/admin/EditStockModal';

const API_URL = import.meta.env.VITE_API_URL;

function AdminPanel({ showToast, user }) {
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState('users');
  
  // Users state
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({ username: '', password: '', role: 'mom' });
  const [newPassword, setNewPassword] = useState('');
  const [stats, setStats] = useState(null);
  
  // Customers state
  const [customers, setCustomers] = useState([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showCustomerEditModal, setShowCustomerEditModal] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerFormData, setCustomerFormData] = useState({ name: '', phone: '', address: '', remarks: '' });
  
  // Stock state
  const [stock, setStock] = useState(null);
  const [stockLoading, setStockLoading] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);
  const [selectedStockType, setSelectedStockType] = useState('');
  const [showStockEditModal, setShowStockEditModal] = useState(false);
  const [stockFormData, setStockFormData] = useState({ filled_count: 0, empty_count: 0 });

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (isAdmin) {
      if (activeTab === 'users') {
        loadUsers();
        loadStats();
      } else if (activeTab === 'customers') {
        loadCustomers();
      } else if (activeTab === 'stock') {
        loadStock();
      }
    }
  }, [isAdmin, activeTab]);

  // ========== USER FUNCTIONS ==========
  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/admin/users`, {
        credentials: 'include' // ✅ Added
      });
      const data = await response.json();
      if (data.success) setUsers(data.users);
    } catch (error) {
      showToast(t('error', language), 'error');
    }
    setLoading(false);
  };

  const loadStats = async () => {
    try {
      const response = await fetch(`${API_URL}/admin/users/stats`, {
        credentials: 'include' // ✅ Added
      });
      const data = await response.json();
      if (data.success) setStats(data.stats);
    } catch (error) {}
  };

  const createUser = async () => {
    if (!formData.username || !formData.password) {
      showToast(t('usernameRequired', language), 'error');
      return;
    }
    if (formData.password.length < 8) { // ✅ Updated to 8 chars
      showToast(t('passwordLength', language), 'error');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/admin/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        credentials: 'include' // ✅ Added
      });
      const data = await response.json();
      if (data.success) {
        showToast(`${t('userCreated', language)} ${formData.username}`, 'success');
        setShowAddModal(false);
        setFormData({ username: '', password: '', role: 'mom' });
        loadUsers();
        loadStats();
      } else {
        showToast(data.message, 'error');
      }
    } catch (error) {
      showToast(t('networkError', language), 'error');
    }
    setLoading(false);
  };

  const updateUser = async () => {
    if (!selectedUser) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/admin/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: formData.username, role: formData.role, is_active: selectedUser.is_active }),
        credentials: 'include' // ✅ Added
      });
      const data = await response.json();
      if (data.success) {
        showToast(t('userUpdated', language), 'success');
        setShowEditModal(false);
        loadUsers();
      } else {
        showToast(data.message, 'error');
      }
    } catch (error) {
      showToast(t('networkError', language), 'error');
    }
    setLoading(false);
  };

  const resetPassword = async () => {
    if (!selectedUser || !newPassword) {
      showToast(t('newPasswordRequired', language), 'error');
      return;
    }
    if (newPassword.length < 8) { // ✅ Updated to 8 chars
      showToast(t('passwordLength', language), 'error');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/admin/users/${selectedUser.id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
        credentials: 'include' // ✅ Added
      });
      const data = await response.json();
      if (data.success) {
        showToast(t('passwordReset', language), 'success');
        setShowResetModal(false);
        setNewPassword('');
      } else {
        showToast(data.message, 'error');
      }
    } catch (error) {
      showToast(t('networkError', language), 'error');
    }
    setLoading(false);
  };

  const toggleUserStatus = async (userId, currentStatus, username) => {
    if (!window.confirm(`${username} ${currentStatus ? t('confirmDeactivate', language) : t('confirmActivate', language)}`)) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentStatus }),
        credentials: 'include' // ✅ Added
      });
      const data = await response.json();
      if (data.success) {
        showToast(`${username} ${!currentStatus ? t('activated', language) : t('deactivated', language)}`, 'success');
        loadUsers();
        loadStats();
      } else {
        showToast(data.message, 'error');
      }
    } catch (error) {
      showToast(t('networkError', language), 'error');
    }
    setLoading(false);
  };

  const deleteUser = async (userId, username) => {
    if (!window.confirm(`${username} ${t('confirmDelete', language)}`)) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/admin/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include' // ✅ Added
      });
      const data = await response.json();
      if (data.success) {
        showToast(`${username} ${t('deleted', language)}`, 'success');
        loadUsers();
        loadStats();
      } else {
        showToast(data.message, 'error');
      }
    } catch (error) {
      showToast(t('networkError', language), 'error');
    }
    setLoading(false);
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setFormData({ username: user.username, role: user.role, password: '' });
    setShowEditModal(true);
  };

  const openResetModal = (user) => {
    setSelectedUser(user);
    setNewPassword('');
    setShowResetModal(true);
  };

  // ========== CUSTOMER FUNCTIONS ==========
  const loadCustomers = async () => {
    setCustomersLoading(true);
    try {
      const response = await fetch(`${API_URL}/customers`, {
        credentials: 'include' // ✅ Added
      });
      const data = await response.json();
      if (data.success) setCustomers(data.data || []);
    } catch (error) {
      showToast(t('error', language), 'error');
    }
    setCustomersLoading(false);
  };

  const updateCustomer = async () => {
    if (!selectedCustomer) return;
    setCustomersLoading(true);
    try {
      const response = await fetch(`${API_URL}/admin/customers/${selectedCustomer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: customerFormData.name,
          phone: customerFormData.phone || null,
          address: customerFormData.address || null,
          remarks: customerFormData.remarks || null
        }),
        credentials: 'include' // ✅ Added
      });
      const data = await response.json();
      if (data.success) {
        showToast(t('customerUpdated', language), 'success');
        setShowCustomerEditModal(false);
        loadCustomers();
      } else {
        showToast(data.message, 'error');
      }
    } catch (error) {
      showToast(t('networkError', language), 'error');
    }
    setCustomersLoading(false);
  };

  // ========== STOCK FUNCTIONS ==========
  const loadStock = async () => {
    setStockLoading(true);
    try {
      const response = await fetch(`${API_URL}/stock`, {
        credentials: 'include' // ✅ Added
      });
      const data = await response.json();
      if (data.success) setStock(data.stock);
    } catch (error) {
      showToast(t('error', language), 'error');
    }
    setStockLoading(false);
  };

  const updateStock = async () => {
    if (!selectedStockType) return;
    setStockLoading(true);
    try {
      const response = await fetch(`${API_URL}/admin/stock/${encodeURIComponent(selectedStockType)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filled_count: parseInt(stockFormData.filled_count),
          empty_count: parseInt(stockFormData.empty_count)
        }),
        credentials: 'include' // ✅ Added
      });
      const data = await response.json();
      if (data.success) {
        showToast(t('stockUpdated', language), 'success');
        setShowStockEditModal(false);
        loadStock();
      } else {
        showToast(data.message, 'error');
      }
    } catch (error) {
      showToast(t('networkError', language), 'error');
    }
    setStockLoading(false);
  };

  const getRoleDisplay = (role) => {
    if (language === 'np') {
      switch(role) {
        case 'admin': return 'प्रशासक';
        case 'mom': return 'सञ्चालक';
        default: return 'कर्मचारी';
      }
    }
    return role === 'admin' ? 'Admin' : 'Operator';
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    (c.phone && c.phone.includes(customerSearch))
  );

  if (!isAdmin) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 text-center">
        <IconAlertCircle className="w-20 h-20 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('accessDenied', language)}</h2>
        <p className="text-gray-600">{t('adminOnly', language)}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Page Header - Blue Gradient */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-500 rounded-2xl p-6 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <IconSettings className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">{t('adminPanel', language)}</h1>
            <p className="text-blue-100 text-base mt-1">{t('systemManagement', language)}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'users' 
              ? 'bg-blue-600 text-white shadow-md' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <IconUsers className="w-5 h-5" />
          {t('users', language)}
        </button>
        <button
          onClick={() => setActiveTab('customers')}
          className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'customers' 
              ? 'bg-blue-600 text-white shadow-md' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <IconDashboard className="w-5 h-5" />
          {t('customers', language)}
        </button>
        <button
          onClick={() => setActiveTab('stock')}
          className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'stock' 
              ? 'bg-blue-600 text-white shadow-md' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <IconPackage className="w-5 h-5" />
          {t('stock', language)}
        </button>
      </div>

      {/* ========== USERS TAB ========== */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-700 to-blue-500 px-6 py-4">
            <div className="flex justify-between items-center flex-wrap gap-3">
              <div>
                <h2 className="text-xl font-bold text-white">{t('userManagement', language)}</h2>
                <p className="text-blue-100 text-sm mt-0.5">{t('userManagementDesc', language)}</p>
              </div>
              <button 
                onClick={() => setShowAddModal(true)} 
                className="px-5 py-2.5 bg-white/20 hover:bg-white/30 text-white rounded-xl font-semibold transition-all flex items-center gap-2"
              >
                <IconPlus className="w-5 h-5" />
                {t('addUser', language)}
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5 bg-gray-50 border-b">
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex justify-between items-center">
                  <div><p className="text-sm text-gray-500">{t('total', language)}</p><p className="text-3xl font-bold text-gray-800">{stats.totalUsers}</p></div>
                  <IconUsers className="w-10 h-10 text-blue-500 opacity-50" />
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex justify-between items-center">
                  <div><p className="text-sm text-gray-500">{t('active', language)}</p><p className="text-3xl font-bold text-green-600">{stats.activeUsers}</p></div>
                  <IconUserCheck className="w-10 h-10 text-green-500 opacity-50" />
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex justify-between items-center">
                  <div><p className="text-sm text-gray-500">{t('admin', language)}</p><p className="text-3xl font-bold text-purple-600">{stats.adminCount}</p></div>
                  <IconDashboard className="w-10 h-10 text-purple-500 opacity-50" />
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex justify-between items-center">
                  <div><p className="text-sm text-gray-500">{t('mom', language)}</p><p className="text-3xl font-bold text-orange-600">{stats.momCount}</p></div>
                  <IconSettings className="w-10 h-10 text-orange-500 opacity-50" />
                </div>
              </div>
            </div>
          )}

          {/* Users Table */}
          <div className="p-5">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b-2">
                  <tr>
                    <th className="text-left p-3 font-semibold text-gray-700">{t('username', language)}</th>
                    <th className="text-left p-3 font-semibold text-gray-700">{t('role', language)}</th>
                    <th className="text-left p-3 font-semibold text-gray-700">{t('status', language)}</th>
                    <th className="text-left p-3 font-semibold text-gray-700">{t('lastLogin', language)}</th>
                    <th className="text-center p-3 font-semibold text-gray-700">{t('actions', language)}</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="5" className="text-center py-12">🔄 {t('loading', language)}...</td></tr>
                  ) : users.length === 0 ? (
                    <tr><td colSpan="5" className="text-center py-12 text-gray-400">📭 {t('noData', language)}</td></tr>
                  ) : (
                    users.map(u => (
                      <tr key={u.id} className="border-b hover:bg-gray-50 transition">
                        <td className="p-3 font-medium">{u.username}</td>
                        <td className="p-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'}`}>
                            {getRoleDisplay(u.role)}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {u.is_active ? t('active', language) : t('inactive', language)}
                          </span>
                        </td>
                        <td className="p-3 text-sm text-gray-500">{u.last_login ? new Date(u.last_login).toLocaleDateString() : '-'}</td>
                        <td className="p-3">
                          <div className="flex justify-center gap-2">
                            <button onClick={() => openEditModal(u)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition" title={t('edit', language)}><IconEdit className="w-4 h-4" /></button>
                            <button onClick={() => openResetModal(u)} className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition" title={t('resetPassword', language)}><IconKey className="w-4 h-4" /></button>
                            <button onClick={() => toggleUserStatus(u.id, u.is_active, u.username)} className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition" title={u.is_active ? t('deactivate', language) : t('activate', language)}><IconUserCheck className="w-4 h-4" /></button>
                            {u.username !== 'admin' && (
                              <button onClick={() => deleteUser(u.id, u.username)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition" title={t('delete', language)}><IconTrash className="w-4 h-4" /></button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <button onClick={loadUsers} className="w-full mt-5 bg-gray-100 hover:bg-gray-200 py-3 rounded-xl font-medium transition flex items-center justify-center gap-2">
              <IconRefresh className="w-5 h-5" /> {t('refresh', language)}
            </button>
          </div>
        </div>
      )}

      {/* ========== CUSTOMERS TAB ========== */}
      {activeTab === 'customers' && (
        <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-700 to-blue-500 px-6 py-4">
            <div className="flex justify-between items-center flex-wrap gap-3">
              <div>
                <h2 className="text-xl font-bold text-white">{t('customerManagement', language)}</h2>
                <p className="text-blue-100 text-sm mt-0.5">{t('customerManagementDesc', language)}</p>
              </div>
              <div className="relative">
                <IconSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  placeholder={t('searchNamePhone', language)}
                  className="w-64 pl-11 pr-4 py-2 text-base border border-white/30 rounded-xl focus:border-white outline-none bg-white/10 text-white placeholder:text-white/70"
                />
              </div>
            </div>
          </div>

          <div className="p-5">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b-2">
                  <tr><th className="text-left p-3 font-semibold text-gray-700">{t('name', language)}</th><th className="text-left p-3 font-semibold text-gray-700">{t('phone', language)}</th><th className="text-left p-3 font-semibold text-gray-700">{t('address', language)}</th><th className="text-left p-3 font-semibold text-gray-700">{t('remarks', language)}</th><th className="text-center p-3 font-semibold text-gray-700">{t('actions', language)}</th></tr>
                </thead>
                <tbody>
                  {customersLoading ? (
                    <tr><td colSpan="5" className="text-center py-12">🔄 {t('loading', language)}...</td></tr>
                  ) : filteredCustomers.length === 0 ? (
                    <tr><td colSpan="5" className="text-center py-12 text-gray-400">📭 {t('noData', language)}</td></tr>
                  ) : (
                    filteredCustomers.map(c => (
                      <tr key={c.id} className="border-b hover:bg-gray-50 transition">
                        <td className="p-3 font-medium">{c.name}</td>
                        <td className="p-3">{c.phone || '-'}</td>
                        <td className="p-3">{c.address || '-'}</td>
                        <td className="p-3 text-sm text-gray-500">{c.remarks || '-'}</td>
                        <td className="p-3">
                          <div className="flex justify-center">
                            <button onClick={() => { 
                              setSelectedCustomer(c); 
                              setCustomerFormData({ 
                                name: c.name, 
                                phone: c.phone || '', 
                                address: c.address || '', 
                                remarks: c.remarks || '' 
                              }); 
                              setShowCustomerEditModal(true); 
                            }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition">
                              <IconEdit className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <button onClick={loadCustomers} className="w-full mt-5 bg-gray-100 hover:bg-gray-200 py-3 rounded-xl font-medium transition flex items-center justify-center gap-2">
              <IconRefresh className="w-5 h-5" /> {t('refresh', language)}
            </button>
          </div>
        </div>
      )}

      {/* ========== STOCK TAB ========== */}
      {activeTab === 'stock' && (
        <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-700 to-blue-500 px-6 py-4">
            <div>
              <h2 className="text-xl font-bold text-white">{t('stockManagement', language)}</h2>
              <p className="text-blue-100 text-sm mt-0.5">{t('stockManagementDesc', language)}</p>
            </div>
          </div>

          <div className="p-5">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b-2">
                  <tr><th className="text-left p-3 font-semibold text-gray-700">{t('cylinderType', language)}</th><th className="text-left p-3 font-semibold text-gray-700">{t('filled', language)}</th><th className="text-left p-3 font-semibold text-gray-700">{t('empty', language)}</th><th className="text-left p-3 font-semibold text-gray-700">{t('total', language)}</th><th className="text-center p-3 font-semibold text-gray-700">{t('actions', language)}</th></tr>
                </thead>
                <tbody>
                  {stockLoading ? (
                    <tr><td colSpan="5" className="text-center py-12">🔄 {t('loading', language)}...</td></tr>
                  ) : !stock ? (
                    <tr><td colSpan="5" className="text-center py-12 text-gray-400">📭 {t('noData', language)}</td></tr>
                  ) : (
                    Object.entries(stock).map(([type, data]) => (
                      <tr key={type} className="border-b hover:bg-gray-50 transition">
                        <td className="p-3 font-medium">{type}</td>
                        <td className="p-3"><span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">{data.filled}</span></td>
                        <td className="p-3"><span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-semibold">{data.empty}</span></td>
                        <td className="p-3 font-semibold">{data.filled + data.empty}</td>
                        <td className="p-3">
                          <div className="flex justify-center">
                            <button onClick={() => { 
                              setSelectedStock(data); 
                              setSelectedStockType(type); 
                              setStockFormData({ filled_count: data.filled, empty_count: data.empty }); 
                              setShowStockEditModal(true); 
                            }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition">
                              <IconEdit className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <button onClick={loadStock} className="w-full mt-5 bg-gray-100 hover:bg-gray-200 py-3 rounded-xl font-medium transition flex items-center justify-center gap-2">
              <IconRefresh className="w-5 h-5" /> {t('refresh', language)}
            </button>
          </div>
        </div>
      )}

      {/* Add User Modal - Inline */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
            <div className="bg-gradient-to-r from-blue-700 to-blue-500 p-5 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-white">{t('addNewUser', language)}</h3>
                <button onClick={() => setShowAddModal(false)} className="text-white hover:bg-white/20 p-1 rounded"><IconX className="w-5 h-5" /></button>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <input type="text" placeholder={t('username', language)} value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} className="w-full p-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 outline-none" />
              <input type="password" placeholder={t('password', language)} value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="w-full p-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 outline-none" />
              <select value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})} className="w-full p-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 outline-none">
                <option value="admin">{t('admin', language)}</option>
                <option value="mom">{t('mom', language)}</option>
              </select>
              <div className="flex gap-3 pt-4">
                <button onClick={() => setShowAddModal(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 py-3 rounded-xl font-semibold transition">{t('cancel', language)}</button>
                <button onClick={createUser} disabled={loading} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold transition disabled:opacity-50">{loading ? t('adding', language) : t('add', language)}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal - Separate Component */}
      {showEditModal && selectedUser && (
        <EditUserModal
          user={selectedUser}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            loadUsers();
            loadStats();
          }}
          showToast={showToast}
        />
      )}

      {/* Reset Password Modal - Inline */}
      {showResetModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
            <div className="bg-gradient-to-r from-orange-600 to-red-600 p-5 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-white">{t('resetPassword', language)}</h3>
                <button onClick={() => setShowResetModal(false)} className="text-white hover:bg-white/20 p-1 rounded"><IconX className="w-5 h-5" /></button>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <p>{t('user', language)}: <strong>{selectedUser.username}</strong></p>
              <input type="password" placeholder={t('newPassword', language)} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full p-3 border-2 border-gray-300 rounded-xl focus:border-orange-500 outline-none" />
              <div className="flex gap-3 pt-4">
                <button onClick={() => setShowResetModal(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 py-3 rounded-xl font-semibold transition">{t('cancel', language)}</button>
                <button onClick={resetPassword} disabled={loading} className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-xl font-semibold transition">{loading ? t('resetting', language) : t('reset', language)}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Customer Modal - Separate Component */}
      {showCustomerEditModal && selectedCustomer && (
        <EditCustomerModal
          customer={selectedCustomer}
          onClose={() => setShowCustomerEditModal(false)}
          onSuccess={() => {
            loadCustomers();
          }}
          showToast={showToast}
        />
      )}

      {/* Edit Stock Modal - Separate Component */}
      {showStockEditModal && selectedStock && (
        <EditStockModal
          stockItem={selectedStock}
          cylinderType={selectedStockType}
          onClose={() => setShowStockEditModal(false)}
          onSuccess={() => {
            loadStock();
          }}
          showToast={showToast}
        />
      )}
    </div>
  );
}

export default AdminPanel;