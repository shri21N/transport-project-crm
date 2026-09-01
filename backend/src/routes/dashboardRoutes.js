import express from 'express';
import { getDashboardMetrics } from '../controllers/dashboardController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(protect);
router.get('/metrics', authorize('admin', 'dispatcher'), getDashboardMetrics);

export default router;
