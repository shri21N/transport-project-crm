import express from 'express';
import {
  register,
  login,
  getMe,
  updatePassword,
  getAllUsers,
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Public routes
router.post('/login', login);
router.post('/register', register);

// Protected routes
router.get('/me', protect, getMe);
router.put('/password', protect, updatePassword);

// Admin-only routes
router.get('/users', protect, authorize('admin'), getAllUsers);

export default router;
