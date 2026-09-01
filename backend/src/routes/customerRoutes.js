import express from 'express';
import {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from '../controllers/customerController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Apply auth protection to all customer routes
router.use(protect);

router
  .route('/')
  .get(authorize('admin', 'dispatcher'), getCustomers)
  .post(authorize('admin', 'dispatcher'), createCustomer);

router
  .route('/:id')
  .get(authorize('admin', 'dispatcher'), getCustomerById)
  .put(authorize('admin', 'dispatcher'), updateCustomer)
  .delete(authorize('admin'), deleteCustomer);

export default router;
