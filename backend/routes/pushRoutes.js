// backend/routes/pushRoutes.js
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { saveSubscription, getUserDevices, removeDevice } = require('../services/pushService');

// Subscribe (supports multiple devices)
router.post('/subscribe', authenticate, async (req, res) => {
  
  try {
    const { subscription } = req.body;
    
    if (!subscription) {
      return res.status(400).json({ success: false, message: 'No subscription provided' });
    }
    
    const success = await saveSubscription(req.user.id, subscription, req);
    
    if (success) {
      res.json({ success: true, message: 'Subscribed successfully' });
    } else {
      res.status(500).json({ success: false, message: 'Failed to save subscription' });
    }
  } catch (error) {
    console.error('Subscribe error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Check subscription status
router.get('/status', authenticate, async (req, res) => {
  const devices = await getUserDevices(req.user.id);
  res.json({ 
    success: true, 
    isSubscribed: devices.length > 0,
    deviceCount: devices.length
  });
});

// Get all user devices
router.get('/devices', authenticate, async (req, res) => {
  const devices = await getUserDevices(req.user.id);
  res.json({ success: true, devices });
});

// Remove a device
router.delete('/devices/:id', authenticate, async (req, res) => {
  const success = await removeDevice(req.user.id, req.params.id);
  res.json({ success });
});

module.exports = router;