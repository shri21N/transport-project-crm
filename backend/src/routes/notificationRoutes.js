import express from 'express';
import {
  getNotificationLogs,
  sendManualNotification,
} from '../controllers/notificationController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', authorize('admin', 'dispatcher'), getNotificationLogs);
router.post('/send', authorize('admin', 'dispatcher'), sendManualNotification);

export default router;
