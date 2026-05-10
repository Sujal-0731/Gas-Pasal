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
  IconSettings
} from '../components/icons';
import { getAuthHeader } from '../utils/api';

const API_URL = import.meta.env.VITE_API_URL;

function AdminPanel({ showToast, user }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'mom'
  });
  const [newPassword, setNewPassword] = useState('');
  const [stats, setStats] = useState(null);

  // Check if current user is admin
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (isAdmin) {
      loadUsers();
      loadStats();
    }
  }, [isAdmin]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/admin/users`, {
        headers: getAuthHeader()
      });
      const data = await response.json();
      if (data.success) {
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      showToast('प्रयोगकर्ता लोड गर्न असफल', 'error');
    }
    setLoading(false);
  };

  const loadStats = async () => {
    try {
      const response = await fetch(`${API_URL}/admin/users/stats`, {
        headers: getAuthHeader()
      });
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const createUser = async () => {
    if (!formData.username || !formData.password) {
      showToast('यूजरनेम र पासवर्ड आवश्यक छ', 'error');
      return;
    }

    if (formData.password.length < 4) {
      showToast('पासवर्ड कम्तीमा ४ अक्षरको हुनुपर्छ', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (data.success) {
        showToast(`प्रयोगकर्ता ${formData.username} सिर्जना गरियो`, 'success');
        setShowAddModal(false);
        setFormData({ username: '', password: '', role: 'mom' });
        loadUsers();
        loadStats();
      } else {
        showToast(data.message || 'प्रयोगकर्ता सिर्जना गर्न असफल', 'error');
      }
    } catch (error) {
      console.error('Create user error:', error);
      showToast('इन्टरनेट जडान जाँच गर्नुहोस्', 'error');
    }
    setLoading(false);
  };

  const updateUser = async () => {
    if (!selectedUser) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/admin/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({
          username: formData.username,
          role: formData.role,
          is_active: selectedUser.is_active
        })
      });
      const data = await response.json();
      if (data.success) {
        showToast(`प्रयोगकर्ता ${formData.username} अपडेट गरियो`, 'success');
        setShowEditModal(false);
        setSelectedUser(null);
        loadUsers();
      } else {
        showToast(data.message || 'अपडेट गर्न असफल', 'error');
      }
    } catch (error) {
      console.error('Update user error:', error);
      showToast('इन्टरनेट जडान जाँच गर्नुहोस्', 'error');
    }
    setLoading(false);
  };

  const resetPassword = async () => {
    if (!selectedUser || !newPassword) {
      showToast('नयाँ पासवर्ड लेख्नुहोस्', 'error');
      return;
    }

    if (newPassword.length < 4) {
      showToast('पासवर्ड कम्तीमा ४ अक्षरको हुनुपर्छ', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/admin/users/${selectedUser.id}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({ newPassword })
      });
      const data = await response.json();
      if (data.success) {
        showToast(`पासवर्ड रिसेट गरियो (${selectedUser.username})`, 'success');
        setShowResetModal(false);
        setSelectedUser(null);
        setNewPassword('');
      } else {
        showToast(data.message || 'पासवर्ड रिसेट गर्न असफल', 'error');
      }
    } catch (error) {
      console.error('Reset password error:', error);
      showToast('इन्टरनेट जडान जाँच गर्नुहोस्', 'error');
    }
    setLoading(false);
  };

  const toggleUserStatus = async (userId, currentStatus, username) => {
    if (!window.confirm(`के तपाईं ${username} लाई ${currentStatus ? 'निष्क्रिय' : 'सक्रिय'} गर्न चाहनुहुन्छ?`)) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({ is_active: !currentStatus })
      });
      const data = await response.json();
      if (data.success) {
        showToast(`${username} ${!currentStatus ? 'सक्रिय' : 'निष्क्रिय'} गरियो`, 'success');
        loadUsers();
        loadStats();
      } else {
        showToast(data.message || 'स्थिति परिवर्तन गर्न असफल', 'error');
      }
    } catch (error) {
      console.error('Toggle status error:', error);
      showToast('इन्टरनेट जडान जाँच गर्नुहोस्', 'error');
    }
    setLoading(false);
  };

  const deleteUser = async (userId, username) => {
    if (!window.confirm(`के तपाईं ${username} लाई पूर्ण रूपमा हटाउन चाहनुहुन्छ? यो कार्य पूर्ववत गर्न सकिँदैन।`)) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/admin/users/${userId}`, {
        method: 'DELETE',
        headers: getAuthHeader()
      });
      const data = await response.json();
      if (data.success) {
        showToast(`${username} हटाइयो`, 'success');
        loadUsers();
        loadStats();
      } else {
        showToast(data.message || 'हटाउन असफल', 'error');
      }
    } catch (error) {
      console.error('Delete user error:', error);
      showToast('इन्टरनेट जडान जाँच गर्नुहोस्', 'error');
    }
    setLoading(false);
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      role: user.role,
      password: ''
    });
    setShowEditModal(true);
  };

  const openResetModal = (user) => {
    setSelectedUser(user);
    setNewPassword('');
    setShowResetModal(true);
  };

  const getRoleDisplay = (role) => {
    switch(role) {
      case 'admin': return 'प्रशासक';
      case 'mom': return 'सञ्चालक';
      default: return 'कर्मचारी';
    }
  };

  if (!isAdmin) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 text-center">
        <IconAlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">पहुँच अस्वीकृत</h2>
        <p className="text-gray-600">यो पृष्ठ केवल प्रशासकको लागि हो।</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">प्रयोगकर्ता व्यवस्थापन</h1>
          <p className="text-base text-gray-500 mt-1">प्रयोगकर्ता थप्नुहोस्, सम्पादन गर्नुहोस् वा हटाउनुहोस्</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
        >
          <IconPlus className="w-5 h-5" />
          नयाँ प्रयोगकर्ता
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">कुल प्रयोगकर्ता</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
              </div>
              <IconUsers className="w-8 h-8 text-blue-500 opacity-50" />
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">सक्रिय प्रयोगकर्ता</p>
                <p className="text-2xl font-bold text-green-600">{stats.activeUsers}</p>
              </div>
              <IconUserCheck className="w-8 h-8 text-green-500 opacity-50" />
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">प्रशासक</p>
                <p className="text-2xl font-bold text-purple-600">{stats.adminCount}</p>
              </div>
              <IconDashboard className="w-8 h-8 text-purple-500 opacity-50" />
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">सञ्चालक</p>
                <p className="text-2xl font-bold text-orange-600">{stats.momCount}</p>
              </div>
              <IconSettings className="w-8 h-8 text-orange-500 opacity-50" />
            </div>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left p-4 font-semibold text-gray-600">यूजरनेम</th>
                <th className="text-left p-4 font-semibold text-gray-600">रोल</th>
                <th className="text-left p-4 font-semibold text-gray-600">स्थिति</th>
                <th className="text-left p-4 font-semibold text-gray-600">पछिल्लो लगइन</th>
                <th className="text-left p-4 font-semibold text-gray-600">सिर्जना मिति</th>
                <th className="text-center p-4 font-semibold text-gray-600">कार्यहरू</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-8">
                    <div className="flex justify-center">
                      <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-gray-400">
                    कुनै प्रयोगकर्ता छैन
                  </td>
                </tr>
              ) : (
                users.map((userItem) => (
                  <tr key={userItem.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-4 font-medium text-gray-900">{userItem.username}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        userItem.role === 'admin' 
                          ? 'bg-purple-100 text-purple-700' 
                          : 'bg-orange-100 text-orange-700'
                      }`}>
                        {getRoleDisplay(userItem.role)}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        userItem.is_active 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {userItem.is_active ? 'सक्रिय' : 'निष्क्रिय'}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-500">
                      {userItem.last_login ? new Date(userItem.last_login).toLocaleDateString('ne-NP') : 'कहिल्यै'}
                    </td>
                    <td className="p-4 text-sm text-gray-500">
                      {new Date(userItem.created_at).toLocaleDateString('ne-NP')}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEditModal(userItem)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="सम्पादन गर्नुहोस्"
                        >
                          <IconEdit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openResetModal(userItem)}
                          className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition"
                          title="पासवर्ड रिसेट गर्नुहोस्"
                        >
                          <IconKey className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toggleUserStatus(userItem.id, userItem.is_active, userItem.username)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                          title={userItem.is_active ? 'निष्क्रिय गर्नुहोस्' : 'सक्रिय गर्नुहोस्'}
                        >
                          <IconUserCheck className="w-4 h-4" />
                        </button>
                        {userItem.username !== 'admin' && (
                          <button
                            onClick={() => deleteUser(userItem.id, userItem.username)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="हटाउनुहोस्"
                          >
                            <IconTrash className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Refresh Button */}
      <button
        onClick={loadUsers}
        className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl text-base font-medium transition-colors flex items-center justify-center gap-2"
      >
        <IconRefresh className="w-5 h-5" />
        ताजा गर्नुहोस्
      </button>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
            <div className="bg-gradient-to-r from-blue-700 to-blue-500 p-5 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-white">नयाँ प्रयोगकर्ता थप्नुहोस्</h3>
                <button onClick={() => setShowAddModal(false)} className="text-white hover:bg-white/20 p-1 rounded">
                  <IconX className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">यूजरनेम *</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                  placeholder="उदाहरण: sabita"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">पासवर्ड *</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                  placeholder="कम्तीमा ४ अक्षर"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">रोल</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                >
                  <option value="admin">प्रशासक (Admin)</option>
                  <option value="mom">सञ्चालक (Mom)</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={createUser}
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition disabled:opacity-50"
                >
                  {loading ? 'थप्दै...' : 'प्रयोगकर्ता थप्नुहोस्'}
                </button>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold transition"
                >
                  रद्द गर्नुहोस्
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
            <div className="bg-gradient-to-r from-blue-700 to-blue-500 p-5 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-white">प्रयोगकर्ता सम्पादन गर्नुहोस्</h3>
                <button onClick={() => setShowEditModal(false)} className="text-white hover:bg-white/20 p-1 rounded">
                  <IconX className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">यूजरनेम</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">रोल</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                >
                  <option value="admin">प्रशासक (Admin)</option>
                  <option value="mom">सञ्चालक (Mom)</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={updateUser}
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition disabled:opacity-50"
                >
                  {loading ? 'सेव्ह गर्दै...' : 'सेव्ह गर्नुहोस्'}
                </button>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold transition"
                >
                  रद्द गर्नुहोस्
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
            <div className="bg-gradient-to-r from-orange-600 to-red-600 p-5 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-white">पासवर्ड रिसेट गर्नुहोस्</h3>
                <button onClick={() => setShowResetModal(false)} className="text-white hover:bg-white/20 p-1 rounded">
                  <IconX className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  प्रयोगकर्ता: <span className="font-bold">{selectedUser.username}</span>
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">नयाँ पासवर्ड</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                  placeholder="कम्तीमा ४ अक्षर"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={resetPassword}
                  disabled={loading}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-lg font-semibold transition disabled:opacity-50"
                >
                  {loading ? 'रिसेट गर्दै...' : 'पासवर्ड रिसेट गर्नुहोस्'}
                </button>
                <button
                  onClick={() => setShowResetModal(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold transition"
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

export default AdminPanel;