// backend/routes/customerRoutes.js
const express = require('express');
const router = express.Router();
const { getAllCustomers, createCustomer } = require('../controllers/customerController');
const { authenticate } = require('../middleware/auth');
const { validateCustomerInput } = require('../middleware/validate');

router.get('/', authenticate, getAllCustomers);
router.post('/', authenticate, validateCustomerInput, createCustomer);

module.exports = router;