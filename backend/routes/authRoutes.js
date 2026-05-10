// backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { login, getCurrentUser } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

// Public route - no authentication needed
router.post('/login', login);

// Protected route - requires authentication
router.get('/me', authenticate, getCurrentUser);

module.exports = router;