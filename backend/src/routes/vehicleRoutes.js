import express from 'express';
import {
  getVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
} from '../controllers/vehicleController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(authorize('admin', 'dispatcher'), getVehicles)
  .post(authorize('admin', 'dispatcher'), createVehicle);

router
  .route('/:id')
  .get(authorize('admin', 'dispatcher'), getVehicleById)
  .put(authorize('admin', 'dispatcher'), updateVehicle)
  .delete(authorize('admin'), deleteVehicle);

export default router;
