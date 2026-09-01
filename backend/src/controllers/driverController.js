import Driver from '../models/Driver.js';
import Booking from '../models/Booking.js';
import User from '../models/User.js';

/**
 * @desc    Get all drivers with filter and search
 * @route   GET /api/drivers
 * @access  Private (Admin, Dispatcher)
 */
export const getDrivers = async (req, res, next) => {
  try {
    const { status, search, page = 1, limit = 50 } = req.query;
    let query = {};

    if (status && status !== 'all') {
      query.availabilityStatus = status;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { licenseNumber: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Driver.countDocuments(query);
    const drivers = await Driver.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    // Stats
    const totalDrivers = await Driver.countDocuments();
    const available = await Driver.countDocuments({ availabilityStatus: 'Available' });
    const onTrip = await Driver.countDocuments({ availabilityStatus: 'On-Trip' });
    const offDuty = await Driver.countDocuments({ availabilityStatus: 'Off-Duty' });

    res.status(200).json({
      success: true,
      count: drivers.length,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      stats: {
        totalDrivers,
        available,
        onTrip,
        offDuty,
      },
      drivers,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single driver details + assigned trips
 * @route   GET /api/drivers/:id
 * @access  Private (Admin, Dispatcher, Driver)
 */
export const getDriverById = async (req, res, next) => {
  try {
    const driver = await Driver.findById(req.params.id);
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found',
      });
    }

    // Driver can only view their own record unless Admin/Dispatcher
    if (req.user.role === 'driver' && req.user.linkedDriverId?.toString() !== driver._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are only authorized to view your own driver profile',
      });
    }

    const bookings = await Booking.find({ driverId: driver._id })
      .populate('customerId', 'name company phone')
      .populate('vehicleId', 'registrationNumber type')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      driver,
      bookings,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new driver record
 * @route   POST /api/drivers
 * @access  Private (Admin, Dispatcher)
 */
export const createDriver = async (req, res, next) => {
  try {
    const { name, licenseNumber, phone, availabilityStatus, address, emergencyContact, experienceYears } = req.body;

    const existing = await Driver.findOne({
      licenseNumber: licenseNumber.toUpperCase().trim(),
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Driver with license number '${licenseNumber}' is already registered.`,
      });
    }

    const driver = await Driver.create({
      name,
      licenseNumber: licenseNumber.toUpperCase().trim(),
      phone,
      availabilityStatus: availabilityStatus || 'Available',
      address,
      emergencyContact,
      experienceYears: Number(experienceYears) || 0,
    });

    res.status(201).json({
      success: true,
      message: 'Driver registered successfully',
      driver,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update driver details
 * @route   PUT /api/drivers/:id
 * @access  Private (Admin, Dispatcher)
 */
export const updateDriver = async (req, res, next) => {
  try {
    if (req.body.licenseNumber) {
      req.body.licenseNumber = req.body.licenseNumber.toUpperCase().trim();
    }

    const driver = await Driver.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Driver updated successfully',
      driver,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete driver
 * @route   DELETE /api/drivers/:id
 * @access  Private (Admin)
 */
export const deleteDriver = async (req, res, next) => {
  try {
    const driver = await Driver.findById(req.params.id);
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found',
      });
    }

    const activeBooking = await Booking.findOne({
      driverId: driver._id,
      status: { $in: ['Assigned', 'In-Transit'] },
    });

    if (activeBooking) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete driver currently assigned to an active trip.',
      });
    }

    // Unlink driver from any user accounts
    await User.updateMany({ linkedDriverId: driver._id }, { linkedDriverId: null });

    await driver.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Driver record removed successfully',
    });
  } catch (error) {
    next(error);
  }
};
