import Booking from '../models/Booking.js';
import Vehicle from '../models/Vehicle.js';
import Driver from '../models/Driver.js';
import Customer from '../models/Customer.js';
import Invoice from '../models/Invoice.js';

/**
 * @desc    Get all bookings with filters (status, customer, driver, vehicle, dates)
 * @route   GET /api/bookings
 * @access  Private (Admin, Dispatcher)
 */
export const getBookings = async (req, res, next) => {
  try {
    const {
      status,
      customerId,
      driverId,
      vehicleId,
      startDate,
      endDate,
      search,
      page = 1,
      limit = 50,
    } = req.query;

    let query = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    if (customerId) query.customerId = customerId;
    if (driverId) query.driverId = driverId;
    if (vehicleId) query.vehicleId = vehicleId;

    if (startDate || endDate) {
      query.scheduledDate = {};
      if (startDate) query.scheduledDate.$gte = new Date(startDate);
      if (endDate) query.scheduledDate.$lte = new Date(endDate);
    }

    if (search) {
      query.$or = [
        { bookingNumber: { $regex: search, $options: 'i' } },
        { pickupLocation: { $regex: search, $options: 'i' } },
        { dropLocation: { $regex: search, $options: 'i' } },
        { goodsDescription: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Booking.countDocuments(query);
    const bookings = await Booking.find(query)
      .populate('customerId', 'name company phone email')
      .populate('vehicleId', 'registrationNumber type capacity')
      .populate('driverId', 'name phone licenseNumber')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    // Aggregate status counts
    const totalBookings = await Booking.countDocuments();
    const pendingCount = await Booking.countDocuments({ status: 'Pending' });
    const assignedCount = await Booking.countDocuments({ status: 'Assigned' });
    const inTransitCount = await Booking.countDocuments({ status: 'In-Transit' });
    const deliveredCount = await Booking.countDocuments({ status: 'Delivered' });
    const cancelledCount = await Booking.countDocuments({ status: 'Cancelled' });

    res.status(200).json({
      success: true,
      count: bookings.length,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      stats: {
        total: totalBookings,
        pending: pendingCount,
        assigned: assignedCount,
        inTransit: inTransitCount,
        delivered: deliveredCount,
        cancelled: cancelledCount,
      },
      bookings,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single booking details + populated references + linked invoice
 * @route   GET /api/bookings/:id
 * @access  Private (Admin, Dispatcher, Driver)
 */
export const getBookingById = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('customerId')
      .populate('vehicleId')
      .populate('driverId')
      .populate('statusHistory.changedBy', 'name role');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // If driver role, verify driver is assigned to this booking
    if (
      req.user.role === 'driver' &&
      booking.driverId?._id?.toString() !== req.user.linkedDriverId?.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'You are not assigned to this trip.',
      });
    }

    // Find linked invoice if generated
    const invoice = await Invoice.findOne({ bookingId: booking._id });

    res.status(200).json({
      success: true,
      booking,
      invoice,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Helper: Check for vehicle or driver booking conflicts on active trips ('Assigned', 'In-Transit')
 * overlapping the scheduled date.
 * Returns { hasConflict: boolean, message?: string }
 */
const checkBookingConflict = async ({ vehicleId, driverId, scheduledDate, excludeBookingId = null }) => {
  const queryDate = scheduledDate ? new Date(scheduledDate) : new Date();

  // Start & End of the target scheduled date
  const startOfDay = new Date(queryDate);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(queryDate);
  endOfDay.setHours(23, 59, 59, 999);

  if (vehicleId) {
    // Check if vehicle has an active conflict (In-Transit is actively on-trip, or Assigned on same date)
    const vehicleConflict = await Booking.findOne({
      _id: { $ne: excludeBookingId },
      vehicleId,
      status: { $in: ['Assigned', 'In-Transit'] },
      $or: [
        { status: 'In-Transit' },
        { scheduledDate: { $gte: startOfDay, $lte: endOfDay } },
      ],
    }).populate('vehicleId', 'registrationNumber');

    if (vehicleConflict) {
      const regNo = vehicleConflict.vehicleId?.registrationNumber || 'Selected vehicle';
      const formattedDate = new Date(vehicleConflict.scheduledDate).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
      return {
        hasConflict: true,
        message: `Vehicle conflict: ${regNo} is already occupied with ${vehicleConflict.status} Consignment #${vehicleConflict.bookingNumber} scheduled on ${formattedDate}.`,
      };
    }
  }

  if (driverId) {
    // Check if driver has an active conflict (In-Transit is actively on-trip, or Assigned on same date)
    const driverConflict = await Booking.findOne({
      _id: { $ne: excludeBookingId },
      driverId,
      status: { $in: ['Assigned', 'In-Transit'] },
      $or: [
        { status: 'In-Transit' },
        { scheduledDate: { $gte: startOfDay, $lte: endOfDay } },
      ],
    }).populate('driverId', 'name');

    if (driverConflict) {
      const driverName = driverConflict.driverId?.name || 'Selected driver';
      const formattedDate = new Date(driverConflict.scheduledDate).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
      return {
        hasConflict: true,
        message: `Driver conflict: ${driverName} is already assigned to ${driverConflict.status} Consignment #${driverConflict.bookingNumber} scheduled on ${formattedDate}.`,
      };
    }
  }

  return { hasConflict: false };
};

/**
 * @desc    Create a new booking / consignment
 * @route   POST /api/bookings
 * @access  Private (Admin, Dispatcher)
 */
export const createBooking = async (req, res, next) => {
  try {
    const {
      customerId,
      vehicleId,
      driverId,
      pickupLocation,
      dropLocation,
      scheduledDate,
      goodsDescription,
      weight,
      estimatedCost,
      specialInstructions,
    } = req.body;

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }

    // Validate for trip scheduling conflicts if vehicle or driver are assigned
    if (vehicleId || driverId) {
      const conflictCheck = await checkBookingConflict({
        vehicleId: vehicleId || null,
        driverId: driverId || null,
        scheduledDate,
      });

      if (conflictCheck.hasConflict) {
        return res.status(409).json({
          success: false,
          message: conflictCheck.message,
        });
      }
    }

    let initialStatus = 'Pending';
    if (vehicleId && driverId) {
      initialStatus = 'Assigned';
    }

    const booking = await Booking.create({
      customerId,
      vehicleId: vehicleId || null,
      driverId: driverId || null,
      pickupLocation,
      dropLocation,
      scheduledDate,
      goodsDescription,
      weight,
      estimatedCost,
      specialInstructions,
      status: initialStatus,
      statusHistory: [
        {
          status: initialStatus,
          changedAt: new Date(),
          changedBy: req.user.id,
          note: 'Consignment booking created in system',
        },
      ],
    });

    // If vehicle and driver were assigned, update their status to On-Trip
    if (vehicleId) {
      await Vehicle.findByIdAndUpdate(vehicleId, { status: 'On-Trip' });
    }
    if (driverId) {
      await Driver.findByIdAndUpdate(driverId, { availabilityStatus: 'On-Trip' });
    }

    // Auto-trigger WhatsApp notification asynchronously
    try {
      const { sendBookingNotification } = await import('../services/whatsappService.js');
      sendBookingNotification(booking._id, 'Booking_Created').catch((err) =>
        console.error('WhatsApp notify error:', err.message)
      );
    } catch (e) {
      console.warn('WhatsApp service import notice:', e.message);
    }

    const populated = await Booking.findById(booking._id)
      .populate('customerId')
      .populate('vehicleId')
      .populate('driverId');

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      booking: populated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Helper: Safely release vehicle & driver back to Available
 * ONLY IF they are not assigned to any other active (Assigned / In-Transit) trips
 */
const safeReleaseVehicleAndDriver = async (vehicleId, driverId, excludeBookingId = null) => {
  if (vehicleId) {
    const otherActive = await Booking.findOne({
      _id: { $ne: excludeBookingId },
      vehicleId,
      status: { $in: ['Assigned', 'In-Transit'] },
    });
    if (!otherActive) {
      await Vehicle.findByIdAndUpdate(vehicleId, { status: 'Available' });
    }
  }

  if (driverId) {
    const otherActive = await Booking.findOne({
      _id: { $ne: excludeBookingId },
      driverId,
      status: { $in: ['Assigned', 'In-Transit'] },
    });
    if (!otherActive) {
      await Driver.findByIdAndUpdate(driverId, { availabilityStatus: 'Available' });
    }
  }
};

/**
 * @desc    Assign vehicle & driver to a booking
 * @route   PUT /api/bookings/:id/assign
 * @access  Private (Admin, Dispatcher)
 */
export const assignBooking = async (req, res, next) => {
  try {
    const { vehicleId, driverId, note } = req.body;

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Check for vehicle / driver trip conflicts
    const conflictCheck = await checkBookingConflict({
      vehicleId: vehicleId || null,
      driverId: driverId || null,
      scheduledDate: booking.scheduledDate,
      excludeBookingId: booking._id,
    });

    if (conflictCheck.hasConflict) {
      return res.status(409).json({
        success: false,
        message: conflictCheck.message,
      });
    }

    // If already had vehicle/driver assigned, safely free the old ones
    if (booking.vehicleId && booking.vehicleId.toString() !== vehicleId) {
      await safeReleaseVehicleAndDriver(booking.vehicleId, null, booking._id);
    }
    if (booking.driverId && booking.driverId.toString() !== driverId) {
      await safeReleaseVehicleAndDriver(null, booking.driverId, booking._id);
    }

    booking.vehicleId = vehicleId;
    booking.driverId = driverId;
    booking.status = 'Assigned';
    booking.statusHistory.push({
      status: 'Assigned',
      changedAt: new Date(),
      changedBy: req.user.id,
      note: note || 'Vehicle and driver assigned to consignment',
    });

    await booking.save();

    // Mark new vehicle and driver as On-Trip
    await Vehicle.findByIdAndUpdate(vehicleId, { status: 'On-Trip' });
    await Driver.findByIdAndUpdate(driverId, { availabilityStatus: 'On-Trip' });

    // Trigger WhatsApp notification asynchronously
    try {
      const { sendBookingNotification } = await import('../services/whatsappService.js');
      sendBookingNotification(booking._id, 'Trip_Assigned').catch((err) =>
        console.error('WhatsApp notify error:', err.message)
      );
    } catch (e) {
      console.warn('WhatsApp service notice:', e.message);
    }

    const updated = await Booking.findById(booking._id)
      .populate('customerId')
      .populate('vehicleId')
      .populate('driverId');

    res.status(200).json({
      success: true,
      message: 'Vehicle and driver assigned successfully',
      booking: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update booking trip status workflow (Pending -> Assigned -> In-Transit -> Delivered -> Cancelled)
 * @route   PUT /api/bookings/:id/status
 * @access  Private (Admin, Dispatcher, Driver)
 */
export const updateBookingStatus = async (req, res, next) => {
  try {
    const { status, note } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Driver authorization check
    if (req.user.role === 'driver') {
      if (booking.driverId?.toString() !== req.user.linkedDriverId?.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You are only authorized to update trips assigned to you.',
        });
      }
      // Drivers can only update to In-Transit or Delivered
      if (!['In-Transit', 'Delivered'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Drivers can only mark trips as In-Transit or Delivered.',
        });
      }
    }

    const previousStatus = booking.status;
    booking.status = status;
    booking.statusHistory.push({
      status,
      changedAt: new Date(),
      changedBy: req.user.id,
      note: note || `Status transitioned from ${previousStatus} to ${status}`,
    });

    // If status became Delivered or Cancelled, safely free the vehicle & driver
    if (['Delivered', 'Cancelled'].includes(status)) {
      await safeReleaseVehicleAndDriver(booking.vehicleId, booking.driverId, booking._id);
    } else if (['Assigned', 'In-Transit'].includes(status)) {
      if (booking.vehicleId) {
        await Vehicle.findByIdAndUpdate(booking.vehicleId, { status: 'On-Trip' });
      }
      if (booking.driverId) {
        await Driver.findByIdAndUpdate(booking.driverId, { availabilityStatus: 'On-Trip' });
      }
    }

    // If status transitioned to "Delivered", auto-generate Invoice if one doesn't exist
    if (status === 'Delivered') {
      const existingInvoice = await Invoice.findOne({ bookingId: booking._id });
      if (!existingInvoice) {
        const baseAmount = booking.estimatedCost || 0;
        const taxRate = 18;
        const tax = Math.round((baseAmount * taxRate) / 100);
        const totalAmount = baseAmount + tax;

        await Invoice.create({
          bookingId: booking._id,
          customerId: booking.customerId,
          amount: baseAmount,
          taxRate,
          tax,
          totalAmount,
          status: 'Unpaid',
        });
      }
    }

    await booking.save();

    // Trigger WhatsApp notification for In-Transit / Delivered
    try {
      const { sendBookingNotification } = await import('../services/whatsappService.js');
      const eventType = status === 'In-Transit' ? 'Trip_InTransit' : status === 'Delivered' ? 'Trip_Delivered' : null;
      if (eventType) {
        sendBookingNotification(booking._id, eventType).catch((err) =>
          console.error('WhatsApp notify error:', err.message)
        );
      }
    } catch (e) {
      console.warn('WhatsApp notice:', e.message);
    }

    const updated = await Booking.findById(booking._id)
      .populate('customerId')
      .populate('vehicleId')
      .populate('driverId')
      .populate('statusHistory.changedBy', 'name role');

    res.status(200).json({
      success: true,
      message: `Trip status updated to '${status}' successfully`,
      booking: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get trips assigned to the currently logged in driver
 * @route   GET /api/bookings/driver-trips
 * @access  Private (Driver, Admin, Dispatcher)
 */
export const getDriverTrips = async (req, res, next) => {
  try {
    let driverId = req.user.linkedDriverId;

    if (!driverId && req.user.role === 'admin') {
      driverId = req.query.driverId;
    }

    if (!driverId) {
      return res.status(400).json({
        success: false,
        message: 'No linked driver ID found on this user profile.',
      });
    }

    const bookings = await Booking.find({ driverId })
      .populate('customerId', 'name company phone address')
      .populate('vehicleId', 'registrationNumber type modelName capacity')
      .sort({ scheduledDate: -1 });

    const activeTrips = bookings.filter((b) => ['Assigned', 'In-Transit'].includes(b.status));
    const completedTrips = bookings.filter((b) => b.status === 'Delivered');

    res.status(200).json({
      success: true,
      count: bookings.length,
      activeTrips,
      completedTrips,
      allTrips: bookings,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete booking (only if Pending, Assigned, or Cancelled)
 * @route   DELETE /api/bookings/:id
 * @access  Private (Admin)
 */
export const deleteBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (['In-Transit'].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete booking in '${booking.status}' status. Please complete or cancel the trip first.`,
      });
    }

    // Safely release vehicle and driver if they are not on any other active trip
    await safeReleaseVehicleAndDriver(booking.vehicleId, booking.driverId, booking._id);

    await Invoice.deleteMany({ bookingId: booking._id });
    await booking.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Booking deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
