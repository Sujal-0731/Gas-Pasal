// backend/routes/dashboardRoutes.js
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { getDashboard } = require('../controllers/dashboardController');
const { validateDashboardRequest } = require('../middleware/validate');
router.use(authenticate);
router.get('/',validateDashboardRequest, getDashboard);

module.exports = router;