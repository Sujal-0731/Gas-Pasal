// backend/routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  resetPassword,
  deleteUser,
  getUserStats,
} = require('../controllers/adminController');

const { updateCustomer } = require('../controllers/customerController');
const { updateStock } = require('../controllers/stockController');

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(authorize('admin'));


router.get('/users', getAllUsers);
router.get('/users/stats', getUserStats);
router.get('/users/:id', getUserById);
router.post('/users', createUser);
router.put('/users/:id', updateUser);
router.post('/users/:id/reset-password', resetPassword);
router.delete('/users/:id', deleteUser);
router.put('/customers/:id', updateCustomer);
router.put('/stock/:type', updateStock);
module.exports = router;