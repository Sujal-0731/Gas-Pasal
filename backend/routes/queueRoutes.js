// backend/routes/queueRoutes.js
const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { 
  validateQueueInput, 
  validateQueueDelete 
} = require('../middleware/validate');
const { 
  getQueue, 
  addToQueue, 
  removeFromQueue,
  getQueueCount,
  getQueueItem
} = require('../controllers/queueController');

// All queue routes require authentication
router.use(authenticate);

// Get all active queue items
router.get('/', getQueue);

// Get queue count (for dashboard)
router.get('/count', getQueueCount);

// Get single queue item
router.get('/:id', getQueueItem);

// Add to queue (mom and admin can do this)
router.post('/', validateQueueInput, addToQueue);

// Remove from queue (mom and admin can do this)
router.delete('/:id', validateQueueDelete, removeFromQueue);

module.exports = router;