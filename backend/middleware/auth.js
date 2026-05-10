// backend/middleware/auth.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../config/database');
const logger = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET;

// Generate token WITHOUT expiration (never expires)
const generateToken = (userId, username, role) => {
  return jwt.sign({ userId, username, role }, JWT_SECRET);
  // No expiresIn - token never expires
};

const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password required' });
    }
    
    const { data: user, error } = await supabase
      .from('users')
      .select('id, username, password_hash, role, is_active')
      .eq('username', username)
      .single();
    
    if (error || !user) {
      logger.warn(`Login failed: User not found - ${username}`);
      return res.status(401).json({ success: false, message: 'Invalid username or password' });
    }
    
    if (!user.is_active) {
      return res.status(401).json({ success: false, message: 'Account disabled. Contact admin.' });
    }
    
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      logger.warn(`Login failed: Invalid password for ${username}`);
      return res.status(401).json({ success: false, message: 'Invalid username or password' });
    }
    
    await supabase.from('users').update({ last_login: new Date() }).eq('id', user.id);
    
    const token = generateToken(user.id, user.username, user.role);
    
    logger.info(`User logged in: ${username} (${user.role})`);
    
    res.json({
      success: true,
      data: { 
        token, 
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
    res.status(500).json({ success: false, message: 'Login failed' });
  }
};

const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }
  
  const token = authHeader.substring(7);
  
  try {
    // Verify token (checks signature, but NOT expiration)
    const decoded = jwt.verify(token, JWT_SECRET);
    
    const { data: user, error } = await supabase
      .from('users')
      .select('id, username, role, is_active')
      .eq('id', decoded.userId)
      .single();
    
    if (error || !user || !user.is_active) {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    
    if (!roles.includes(req.user.role)) {
      logger.warn(`Unauthorized: ${req.user.username} (${req.user.role}) tried to access ${req.url}`);
      return res.status(403).json({ success: false, message: 'Insufficient permissions' });
    }
    
    next();
  };
};

module.exports = { login, authenticate, authorize };