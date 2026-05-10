// backend/controllers/adminController.js
const bcrypt = require('bcryptjs');
const supabase = require('../config/database');
const logger = require('../utils/logger');

// Get all users (admin only)
const getAllUsers = async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, username, role, is_active, last_login, created_at')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    // Don't send password hashes
    const safeUsers = users.map(user => ({
      ...user,
      password_hash: undefined
    }));
    
    res.json({ success: true, users: safeUsers });
  } catch (error) {
    logger.error('Get all users error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get single user by ID
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data: user, error } = await supabase
      .from('users')
      .select('id, username, role, is_active, last_login, created_at')
      .eq('id', id)
      .single();
    
    if (error || !user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    res.json({ success: true, user });
  } catch (error) {
    logger.error('Get user by ID error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create new user (admin only)
const createUser = async (req, res) => {
  try {
    const { username, password, role = 'mom' } = req.body;
    
    // Validate input
    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username and password required' 
      });
    }
    
    if (username.length < 3) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username must be at least 3 characters' 
      });
    }
    
    if (password.length < 4) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be at least 4 characters' 
      });
    }
    
    // Check if user already exists
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .single();
    
    if (existing) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username already exists' 
      });
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Create user
    const { data: user, error } = await supabase
      .from('users')
      .insert([{
        username,
        password_hash: passwordHash,
        role: role,
        is_active: true
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    logger.info(`Admin ${req.user.username} created new user: ${username} (${role})`);
    
    res.json({ 
      success: true, 
      message: `User ${username} created successfully`,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        is_active: user.is_active
      }
    });
    
  } catch (error) {
    logger.error('Create user error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update user (admin only)
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, role, is_active } = req.body;
    
    // Check if user exists
    const { data: existing, error: findError } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', id)
      .single();
    
    if (findError || !existing) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Prevent disabling the last admin
    if (is_active === false && existing.role === 'admin') {
      const { count } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'admin')
        .eq('is_active', true);
      
      if (count === 1) {
        return res.status(400).json({ 
          success: false, 
          message: 'Cannot disable the last active admin user' 
        });
      }
    }
    
    // Prepare update data
    const updateData = {};
    if (username) updateData.username = username;
    if (role) updateData.role = role;
    if (is_active !== undefined) updateData.is_active = is_active;
    
    const { data: user, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    logger.info(`Admin ${req.user.username} updated user: ${user.username}`);
    
    res.json({ 
      success: true, 
      message: 'User updated successfully',
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        is_active: user.is_active
      }
    });
    
  } catch (error) {
    logger.error('Update user error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Reset user password (admin only)
const resetPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    
    if (!newPassword || newPassword.length < 4) {
      return res.status(400).json({ 
        success: false, 
        message: 'New password must be at least 4 characters' 
      });
    }
    
    // Check if user exists
    const { data: existing, error: findError } = await supabase
      .from('users')
      .select('id, username')
      .eq('id', id)
      .single();
    
    if (findError || !existing) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);
    
    // Update password
    const { error } = await supabase
      .from('users')
      .update({ password_hash: passwordHash })
      .eq('id', id);
    
    if (error) throw error;
    
    logger.info(`Admin ${req.user.username} reset password for user: ${existing.username}`);
    
    res.json({ 
      success: true, 
      message: `Password reset for ${existing.username}` 
    });
    
  } catch (error) {
    logger.error('Reset password error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete user (admin only)
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if user exists
    const { data: existing, error: findError } = await supabase
      .from('users')
      .select('id, username, role')
      .eq('id', id)
      .single();
    
    if (findError || !existing) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Prevent deleting the last admin
    if (existing.role === 'admin') {
      const { count } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'admin')
        .eq('is_active', true);
      
      if (count === 1) {
        return res.status(400).json({ 
          success: false, 
          message: 'Cannot delete the last admin user' 
        });
      }
    }
    
    // Delete user
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    logger.info(`Admin ${req.user.username} deleted user: ${existing.username}`);
    
    res.json({ 
      success: true, 
      message: `User ${existing.username} deleted successfully` 
    });
    
  } catch (error) {
    logger.error('Delete user error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get user stats (admin only)
const getUserStats = async (req, res) => {
  try {
    // Get total users count
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    
    // Get active users count
    const { count: activeUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);
    
    // Get admin count
    const { count: adminCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'admin');
    
    // Get mom (staff) count
    const { count: momCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'mom');
    
    res.json({ 
      success: true, 
      stats: {
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        adminCount: adminCount || 0,
        momCount: momCount || 0
      }
    });
    
  } catch (error) {
    logger.error('Get user stats error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
// Update Customer
const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, address, remarks } = req.body;
    
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (remarks !== undefined) updateData.remarks = remarks;
    
    const { data, error } = await supabase
      .from('customers')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    res.json({ success: true, message: 'Customer updated', customer: data });
  } catch (error) {
    logger.error('Update customer error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update Stock
const updateStock = async (req, res) => {
  try {
    const { type } = req.params;
    const { filled_count, empty_count } = req.body;
    
    const updateData = {};
    if (filled_count !== undefined) updateData.filled_count = filled_count;
    if (empty_count !== undefined) updateData.empty_count = empty_count;
    updateData.updated_at = new Date();
    
    const { data, error } = await supabase
      .from('stock')
      .update(updateData)
      .eq('cylinder_type', decodeURIComponent(type))
      .select()
      .single();
    
    if (error) throw error;
    res.json({ success: true, message: 'Stock updated', stock: data });
  } catch (error) {
    logger.error('Update stock error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  resetPassword,
  deleteUser,
  getUserStats,
  updateCustomer,
  updateStock
};