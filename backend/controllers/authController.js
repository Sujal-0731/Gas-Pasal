// backend/controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../config/database');
const logger = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET ;
if (!JWT_SECRET) {
  throw new Error('CRITICAL: JWT_SECRET environment variable must be set');
}
const TOKEN_EXPIRY = '30d';
const generateToken = (userId, username, role) => {
  return jwt.sign({ userId, username, role }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
};

const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username and password required' 
      });
    }
    
    const { data: user, error } = await supabase
      .from('users')
      .select('id, username, password_hash, role, is_active')
      .eq('username', username)
      .single();
    
    if (error || !user) {
      logger.warn(`Login failed: User not found - ${username}`);
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid username or password' 
      });
    }
    
    if (!user.is_active) {
      return res.status(401).json({ 
        success: false, 
        message: 'Account disabled. Contact admin.' 
      });
    }
    
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      logger.warn(`Login failed: Invalid password for ${username}`);
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid username or password' 
      });
    }
    
    await supabase
      .from('users')
      .update({ last_login: new Date() })
      .eq('id', user.id);
    
    const token = generateToken(user.id, user.username, user.role);
    
    const isProduction = process.env.NODE_ENV === 'production';
    
    console.log('Setting cookie with:', {
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax',
      tokenLength: token.length
    });
    
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: '/'
    });
    
    // Log the response headers that will be sent
    res.on('finish', () => {
      console.log('Response headers sent:', res.getHeaders());
    });
    
    logger.info(`User logged in: ${username} (${user.role})`);
    
    // Send user data without token (token is in cookie)
    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          role: user.role
        }
      },
      message: 'Login successful'
    });
    
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Login failed' 
    });
  }
};
const getCurrentUser = async (req, res) => {
  res.json({ 
    success: true, 
    data: { 
      user: req.user 
    } 
  });
};

const logout = async (req, res) => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  res.clearCookie('auth_token', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    path: '/'
  });
  res.json({ success: true, message: 'Logged out successfully' });
};

module.exports = { login, getCurrentUser, logout };