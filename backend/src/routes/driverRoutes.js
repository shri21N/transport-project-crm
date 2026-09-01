import express from 'express';
import {
  getDrivers,
  getDriverById,
  createDriver,
  updateDriver,
  deleteDriver,
} from '../controllers/driverController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(authorize('admin', 'dispatcher'), getDrivers)
  .post(authorize('admin', 'dispatcher'), createDriver);

router
  .route('/:id')
  .get(authorize('admin', 'dispatcher', 'driver'), getDriverById)
  .put(authorize('admin', 'dispatcher'), updateDriver)
  .delete(authorize('admin'), deleteDriver);

export default router;
