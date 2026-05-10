// backend/routes/refillRoutes.js
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { validateRefillInput } = require('../middleware/validate');
const { createRefill, getRefills } = require('../controllers/refillController');

router.use(authenticate);

router.post('/', validateRefillInput, createRefill);
router.get('/', getRefills);

module.exports = router;