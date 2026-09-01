import express from 'express';
import {
  getBookings,
  getBookingById,
  createBooking,
  assignBooking,
  updateBookingStatus,
  getDriverTrips,
  deleteBooking,
} from '../controllers/bookingController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(protect);

// Driver specific trips endpoint
router.get('/driver/my-trips', authorize('driver', 'admin', 'dispatcher'), getDriverTrips);

// General bookings
router
  .route('/')
  .get(authorize('admin', 'dispatcher'), getBookings)
  .post(authorize('admin', 'dispatcher'), createBooking);

router
  .route('/:id')
  .get(authorize('admin', 'dispatcher', 'driver'), getBookingById)
  .delete(authorize('admin'), deleteBooking);

// Assignment & Status workflow endpoints
router.put('/:id/assign', authorize('admin', 'dispatcher'), assignBooking);
router.put('/:id/status', authorize('admin', 'dispatcher', 'driver'), updateBookingStatus);

export default router;
