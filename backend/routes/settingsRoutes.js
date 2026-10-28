// backend/routes/settingsRoutes.js
// Phase 6.1: shop settings. GET is for every signed-in user (the transaction
// flows need the current default price); updating is admin-only.
const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { validateSettingsInput } = require('../middleware/validate');
const { getSettings, updateSettings } = require('../controllers/settingsController');

router.use(authenticate);

router.get('/', getSettings);
router.put('/', authorize('admin'), validateSettingsInput, updateSettings);

module.exports = router;