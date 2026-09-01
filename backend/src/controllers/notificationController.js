import NotificationLog from '../models/NotificationLog.js';
import { sendWhatsAppMessage } from '../services/whatsappService.js';

/**
 * @desc    Get WhatsApp notification logs
 * @route   GET /api/notifications
 * @access  Private (Admin, Dispatcher)
 */
export const getNotificationLogs = async (req, res, next) => {
  try {
    const { status, type, search, page = 1, limit = 50 } = req.query;
    let query = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    if (type && type !== 'all') {
      query.type = type;
    }

    if (search) {
      query.$or = [
        { recipientPhone: { $regex: search, $options: 'i' } },
        { recipientName: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await NotificationLog.countDocuments(query);
    const logs = await NotificationLog.find(query)
      .populate('relatedBookingId', 'bookingNumber pickupLocation dropLocation')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const totalCount = await NotificationLog.countDocuments();
    const sentCount = await NotificationLog.countDocuments({ status: 'sent' });
    const failedCount = await NotificationLog.countDocuments({ status: 'failed' });

    res.status(200).json({
      success: true,
      count: logs.length,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      stats: {
        total: totalCount,
        sent: sentCount,
        failed: failedCount,
        deliveryRate: totalCount > 0 ? Math.round((sentCount / totalCount) * 100) : 100,
      },
      logs,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Send custom / manual WhatsApp message to a recipient
 * @route   POST /api/notifications/send
 * @access  Private (Admin, Dispatcher)
 */
export const sendManualNotification = async (req, res, next) => {
  try {
    const { phone, recipientName, message, relatedBookingId } = req.body;

    if (!phone || !message) {
      return res.status(400).json({
        success: false,
        message: 'Please provide recipient phone number and message text.',
      });
    }

    const result = await sendWhatsAppMessage({
      to: phone,
      recipientName: recipientName || '',
      message,
      type: 'General',
      relatedBookingId: relatedBookingId || null,
    });

    res.status(200).json({
      success: true,
      message: 'WhatsApp notification dispatched.',
      result,
    });
  } catch (error) {
    next(error);
  }
};
