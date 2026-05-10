// backend/routes/transactionRoutes.js
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { validateTransactionInput } = require('../middleware/validate');
const { createTransaction, getCustomerHistory } = require('../controllers/transactionController');

router.use(authenticate);

router.post('/', validateTransactionInput, createTransaction);
router.get('/customer/:name/history', getCustomerHistory);

module.exports = router;