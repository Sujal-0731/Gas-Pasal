// backend/routes/transactionRoutes.js
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { validateTransactionInput } = require('../middleware/validate');
const { createTransaction, getCustomerHistory,getAllTransactions } = require('../controllers/transactionController');

router.use(authenticate);

router.post('/', validateTransactionInput, createTransaction);
router.get('/customer/:name/history', getCustomerHistory);
router.get('/all', authenticate, getAllTransactions);
module.exports = router;