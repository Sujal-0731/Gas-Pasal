// backend/routes/stockRoutes.js
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { getStock } = require('../controllers/stockController');

router.use(authenticate);
router.get('/', getStock);

module.exports = router;