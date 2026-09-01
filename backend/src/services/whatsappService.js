import axios from 'axios';
import NotificationLog from '../models/NotificationLog.js';
import Booking from '../models/Booking.js';

/**
 * Send WhatsApp message via Meta WhatsApp Cloud API (Graph API)
 * Non-blocking, safe wrapper with full MongoDB logging.
 *
 * @param {Object} options
 * @param {string} options.to - Recipient phone number in E.164 format (+919876543210)
 * @param {string} options.recipientName - Customer name
 * @param {string} options.message - Message body content
 * @param {string} options.type - Event type
 * @param {string} options.relatedBookingId - Associated booking ObjectId
 */
export const sendWhatsAppMessage = async ({
  to,
  recipientName = '',
  message,
  type = 'General',
  relatedBookingId = null,
}) => {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const apiVersion = process.env.WHATSAPP_API_VERSION || 'v20.0';

  // Format recipient phone number: ensure no dashes/spaces, remove leading + for Meta API format
  let cleanPhone = (to || '').replace(/[^\d+]/g, '');
  const metaPhone = cleanPhone.startsWith('+') ? cleanPhone.slice(1) : cleanPhone;

  // Check if live Meta credentials are configured
  const isMetaConfigured =
    token &&
    token !== 'your_meta_system_user_access_token' &&
    phoneNumberId &&
    phoneNumberId !== 'your_whatsapp_phone_number_id';

  if (!isMetaConfigured) {
    console.log(`\n💬 [WhatsApp Cloud API Mock / Dev Mode]`);
    console.log(`👉 To: ${cleanPhone} (${recipientName})`);
    console.log(`👉 Type: ${type}`);
    console.log(`👉 Body:\n${message}\n`);

    // Log to DB as simulated sent
    try {
      await NotificationLog.create({
        recipientPhone: cleanPhone,
        recipientName,
        message,
        type,
        relatedBookingId,
        status: 'sent',
        errorMessage: 'Simulated dispatch (Meta API credentials not set or in test mode)',
      });
    } catch (e) {
      console.error('Failed to write notification log:', e.message);
    }

    return { success: true, simulated: true };
  }

  try {
    const url = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;
    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: metaPhone,
      type: 'text',
      text: {
        preview_url: false,
        body: message,
      },
    };

    const response = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    // Log successful dispatch to MongoDB
    await NotificationLog.create({
      recipientPhone: cleanPhone,
      recipientName,
      message,
      type,
      relatedBookingId,
      status: 'sent',
      responsePayload: response.data,
    });

    return { success: true, data: response.data };
  } catch (error) {
    const errorDetail =
      error.response?.data?.error?.message || error.message || 'WhatsApp dispatch error';
    console.error(`❌ WhatsApp Cloud API Error (${cleanPhone}):`, errorDetail);

    // Log failure without breaking the caller workflow
    try {
      await NotificationLog.create({
        recipientPhone: cleanPhone,
        recipientName,
        message,
        type,
        relatedBookingId,
        status: 'failed',
        errorMessage: errorDetail,
        responsePayload: error.response?.data || null,
      });
    } catch (dbErr) {
      console.error('Failed to log WhatsApp failure:', dbErr.message);
    }

    return { success: false, error: errorDetail };
  }
};

/**
 * Trigger dynamic WhatsApp notification messages based on booking events
 */
export const sendBookingNotification = async (bookingId, eventType) => {
  try {
    const booking = await Booking.findById(bookingId)
      .populate('customerId')
      .populate('vehicleId')
      .populate('driverId');

    if (!booking || !booking.customerId || !booking.customerId.phone) {
      return;
    }

    const customer = booking.customerId;
    const bookingNum = booking.bookingNumber || booking._id.toString().slice(-6);
    let messageText = '';

    switch (eventType) {
      case 'Booking_Created':
        messageText = `🚚 *Transport CRM Booking Confirmation*\n\nHello ${customer.name},\nYour booking *#${bookingNum}* has been confirmed!\n\n📍 *Origin:* ${booking.pickupLocation}\n🎯 *Destination:* ${booking.dropLocation}\n📦 *Cargo:* ${booking.goodsDescription}\n🗓️ *Scheduled Date:* ${new Date(booking.scheduledDate).toLocaleDateString()}\n💰 *Estimated Cost:* ₹${booking.estimatedCost?.toLocaleString()}\n\nWe will update you once fleet and pilot are assigned.`;
        break;

      case 'Trip_Assigned':
        messageText = `🚛 *Transport CRM Fleet Assigned*\n\nHello ${customer.name},\nVehicle & pilot assigned for booking *#${bookingNum}*:\n\n🚙 *Vehicle:* ${booking.vehicleId?.registrationNumber || 'N/A'} (${booking.vehicleId?.type || 'Truck'})\n👨‍✈️ *Pilot Name:* ${booking.driverId?.name || 'Assigned Driver'}\n📞 *Pilot Phone:* ${booking.driverId?.phone || 'N/A'}\n\nYour consignment is being prepared for transit.`;
        break;

      case 'Trip_InTransit':
        messageText = `🛣️ *Transport CRM Trip Dispatched (In-Transit)*\n\nHello ${customer.name},\nYour consignment *#${bookingNum}* is now *IN-TRANSIT* towards ${booking.dropLocation}.\n\n👨‍✈️ *Pilot Contact:* ${booking.driverId?.name} (${booking.driverId?.phone})\n🚙 *Vehicle:* ${booking.vehicleId?.registrationNumber}\n\nThank you for choosing Transport CRM.`;
        break;

      case 'Trip_Delivered':
        messageText = `✅ *Transport CRM Consignment Delivered!*\n\nHello ${customer.name},\nYour consignment *#${bookingNum}* has been successfully *DELIVERED* to ${booking.dropLocation}!\n\n🧾 Invoice has been generated. You can complete payment online via Razorpay or cash settlement.\n\nThank you for trusting our logistics services!`;
        break;

      default:
        messageText = `📢 *Transport CRM Update*\n\nHello ${customer.name}, your consignment #${bookingNum} status is now: ${booking.status}.`;
    }

    await sendWhatsAppMessage({
      to: customer.phone,
      recipientName: customer.name,
      message: messageText,
      type: eventType,
      relatedBookingId: booking._id,
    });
  } catch (error) {
    console.error('Error generating WhatsApp booking notification:', error.message);
  }
};

/**
 * Trigger WhatsApp notification for Payment Received
 */
export const sendPaymentNotification = async (invoice, booking, customer) => {
  try {
    const phone = customer.phone;
    if (!phone) return;

    const messageText = `💳 *Payment Confirmation - Transport CRM*\n\nHello ${customer.name},\nWe have successfully received your payment of *₹${invoice.totalAmount.toLocaleString()}* for Invoice *#${invoice.invoiceNumber}* (Booking #${booking.bookingNumber || booking._id}).\n\nPayment Method: ${invoice.paymentMethod || 'Razorpay'}\nStatus: *PAID*\n\nThank you for your business!`;

    await sendWhatsAppMessage({
      to: phone,
      recipientName: customer.name,
      message: messageText,
      type: 'Payment_Received',
      relatedBookingId: booking._id,
    });
  } catch (error) {
    console.error('Error sending payment notification:', error.message);
  }
};

export default {
  sendWhatsAppMessage,
  sendBookingNotification,
  sendPaymentNotification,
};
