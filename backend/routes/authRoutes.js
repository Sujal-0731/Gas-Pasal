const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { login, getCurrentUser,logout } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

// Stricter limiter for login (prevents brute force attacks)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Only 5 attempts per 15 minutes
  skipSuccessfulRequests: true,
  message: { success: false, message: 'Too many login attempts. Please try again after 15 minutes.' }
});

// Public route - with rate limiting
router.post('/login', loginLimiter, login);

// Protected route - requires authentication
router.get('/me', authenticate, getCurrentUser);

// Protected route - requires authentication
router.post('/logout', authenticate, logout);

module.exports = router;