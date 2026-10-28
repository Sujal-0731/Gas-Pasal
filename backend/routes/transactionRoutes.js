// backend/routes/transactionRoutes.js
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { validateTransactionInput, validatePaymentInput, validateTransactionIdParam } = require('../middleware/validate');
const { createTransaction, getCustomerHistory, getAllTransactions, recordPayment, getTransactionPayments } = require('../controllers/transactionController');

router.use(authenticate);

router.post('/', validateTransactionInput, createTransaction);
router.get('/customer/:name/history', getCustomerHistory);
router.get('/all', authenticate, getAllTransactions);

// Phase 6: installment payments
router.get('/:id/payments', validateTransactionIdParam, getTransactionPayments);
router.post('/:id/payments', validateTransactionIdParam, validatePaymentInput, recordPayment);

module.exports = router;