import Invoice from '../models/Invoice.js';
import Booking from '../models/Booking.js';
import Customer from '../models/Customer.js';
import { createOrder, verifySignature } from '../services/razorpayService.js';
import { sendPaymentNotification } from '../services/whatsappService.js';

/**
 * @desc    Get all invoices with filters & stats
 * @route   GET /api/invoices
 * @access  Private (Admin, Dispatcher)
 */
export const getInvoices = async (req, res, next) => {
  try {
    const { status, customerId, search, page = 1, limit = 50 } = req.query;
    let query = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    if (customerId) {
      query.customerId = customerId;
    }

    if (search) {
      query.$or = [
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { razorpayOrderId: { $regex: search, $options: 'i' } },
        { razorpayPaymentId: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Invoice.countDocuments(query);
    const invoices = await Invoice.find(query)
      .populate('customerId', 'name company phone email address')
      .populate({
        path: 'bookingId',
        select: 'bookingNumber pickupLocation dropLocation goodsDescription scheduledDate',
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    // Revenue aggregations
    const allInvoices = await Invoice.find();
    const totalBilled = allInvoices.reduce((acc, inv) => acc + inv.totalAmount, 0);
    const totalCollected = allInvoices
      .filter((inv) => inv.status === 'Paid')
      .reduce((acc, inv) => acc + inv.totalAmount, 0);
    const totalPending = allInvoices
      .filter((inv) => inv.status === 'Unpaid')
      .reduce((acc, inv) => acc + inv.totalAmount, 0);
    const paidCount = allInvoices.filter((inv) => inv.status === 'Paid').length;
    const unpaidCount = allInvoices.filter((inv) => inv.status === 'Unpaid').length;

    res.status(200).json({
      success: true,
      count: invoices.length,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      stats: {
        totalBilled,
        totalCollected,
        totalPending,
        totalInvoices: allInvoices.length,
        paidCount,
        unpaidCount,
      },
      invoices,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single invoice details
 * @route   GET /api/invoices/:id
 * @access  Private (Admin, Dispatcher)
 */
export const getInvoiceById = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('customerId')
      .populate({
        path: 'bookingId',
        populate: [
          { path: 'vehicleId', select: 'registrationNumber type' },
          { path: 'driverId', select: 'name phone' },
        ],
      });

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    res.status(200).json({
      success: true,
      invoice,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create Razorpay Order for an Unpaid Invoice
 * @route   POST /api/invoices/:id/create-order
 * @access  Private (Admin, Dispatcher)
 */
export const createRazorpayOrder = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    if (invoice.status === 'Paid') {
      return res.status(400).json({ success: false, message: 'Invoice is already paid.' });
    }

    const order = await createOrder({
      invoiceId: invoice._id,
      invoiceNumber: invoice.invoiceNumber,
      amountInRupees: invoice.totalAmount,
    });

    invoice.razorpayOrderId = order.id;
    await invoice.save();

    res.status(200).json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency || 'INR',
      keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_demo',
      isSimulated: order.isSimulated || false,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Verify Razorpay payment signature & mark invoice as Paid
 * @route   POST /api/invoices/:id/verify-payment
 * @access  Private (Admin, Dispatcher)
 */
export const verifyRazorpayPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const invoice = await Invoice.findById(req.params.id)
      .populate('customerId')
      .populate('bookingId');

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    const isValid = verifySignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    });

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Razorpay payment signature verification failed.',
      });
    }

    invoice.status = 'Paid';
    invoice.paymentMethod = 'Razorpay';
    invoice.razorpayOrderId = razorpay_order_id;
    invoice.razorpayPaymentId = razorpay_payment_id;
    invoice.razorpaySignature = razorpay_signature;
    invoice.paidAt = new Date();
    await invoice.save();

    // Trigger WhatsApp payment confirmation
    if (invoice.customerId && invoice.bookingId) {
      sendPaymentNotification(invoice, invoice.bookingId, invoice.customerId).catch((err) =>
        console.error('WhatsApp payment receipt error:', err.message)
      );
    }

    res.status(200).json({
      success: true,
      message: 'Payment verified and invoice marked as Paid!',
      invoice,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Manual offline cash payment marking
 * @route   PUT /api/invoices/:id/mark-paid
 * @access  Private (Admin, Dispatcher)
 */
export const markPaidManual = async (req, res, next) => {
  try {
    const { paymentMethod = 'Cash' } = req.body;
    const invoice = await Invoice.findById(req.params.id)
      .populate('customerId')
      .populate('bookingId');

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    invoice.status = 'Paid';
    invoice.paymentMethod = paymentMethod;
    invoice.paidAt = new Date();
    await invoice.save();

    // Trigger WhatsApp notification
    if (invoice.customerId && invoice.bookingId) {
      sendPaymentNotification(invoice, invoice.bookingId, invoice.customerId).catch((err) =>
        console.error('WhatsApp notice error:', err.message)
      );
    }

    res.status(200).json({
      success: true,
      message: `Invoice marked as Paid via ${paymentMethod}`,
      invoice,
    });
  } catch (error) {
    next(error);
  }
};
