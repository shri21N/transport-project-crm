import express from 'express';
import {
  getInvoices,
  getInvoiceById,
  createRazorpayOrder,
  verifyRazorpayPayment,
  markPaidManual,
} from '../controllers/invoiceController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', authorize('admin', 'dispatcher'), getInvoices);
router.get('/:id', authorize('admin', 'dispatcher'), getInvoiceById);

// Razorpay Test Payment Endpoints
router.post('/:id/create-order', authorize('admin', 'dispatcher'), createRazorpayOrder);
router.post('/:id/verify-payment', authorize('admin', 'dispatcher'), verifyRazorpayPayment);

// Offline Cash payment marking fallback
router.put('/:id/mark-paid', authorize('admin', 'dispatcher'), markPaidManual);

export default router;
