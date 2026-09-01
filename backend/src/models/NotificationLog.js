import mongoose from 'mongoose';

const notificationLogSchema = new mongoose.Schema(
  {
    recipientPhone: {
      type: String,
      required: [true, 'Recipient phone number is required'],
      trim: true,
    },
    recipientName: {
      type: String,
      trim: true,
      default: '',
    },
    message: {
      type: String,
      required: [true, 'Notification message body is required'],
    },
    type: {
      type: String,
      enum: [
        'Booking_Created',
        'Trip_Assigned',
        'Trip_InTransit',
        'Trip_Delivered',
        'Payment_Received',
        'General',
      ],
      default: 'General',
    },
    relatedBookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      default: null,
    },
    status: {
      type: String,
      enum: ['sent', 'failed'],
      default: 'sent',
    },
    errorMessage: {
      type: String,
      default: null,
    },
    responsePayload: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

notificationLogSchema.index({ recipientPhone: 1 });
notificationLogSchema.index({ relatedBookingId: 1 });
notificationLogSchema.index({ status: 1 });
notificationLogSchema.index({ createdAt: -1 });

const NotificationLog = mongoose.model('NotificationLog', notificationLogSchema);
export default NotificationLog;
