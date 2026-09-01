import Vehicle from '../models/Vehicle.js';
import Booking from '../models/Booking.js';

/**
 * @desc    Get all vehicles with filters (status, type, search)
 * @route   GET /api/vehicles
 * @access  Private (Admin, Dispatcher)
 */
export const getVehicles = async (req, res, next) => {
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
        { registrationNumber: { $regex: search, $options: 'i' } },
        { modelName: { $regex: search, $options: 'i' } },
        { capacity: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Vehicle.countDocuments(query);
    const vehicles = await Vehicle.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    // Calculate quick fleet status counts
    const totalFleet = await Vehicle.countDocuments();
    const available = await Vehicle.countDocuments({ status: 'Available' });
    const onTrip = await Vehicle.countDocuments({ status: 'On-Trip' });
    const maintenance = await Vehicle.countDocuments({ status: 'Maintenance' });

    res.status(200).json({
      success: true,
      count: vehicles.length,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      stats: {
        totalFleet,
        available,
        onTrip,
        maintenance,
        utilizationRate: totalFleet > 0 ? Math.round((onTrip / totalFleet) * 100) : 0,
      },
      vehicles,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single vehicle details + recent trips
 * @route   GET /api/vehicles/:id
 * @access  Private (Admin, Dispatcher)
 */
export const getVehicleById = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found',
      });
    }

    // Find current active booking or past bookings
    const bookings = await Booking.find({ vehicleId: vehicle._id })
      .populate('customerId', 'name company phone')
      .populate('driverId', 'name phone')
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      vehicle,
      recentBookings: bookings,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new vehicle
 * @route   POST /api/vehicles
 * @access  Private (Admin, Dispatcher)
 */
export const createVehicle = async (req, res, next) => {
  try {
    const { registrationNumber, type, capacity, status, modelName, fuelType } = req.body;

    const existing = await Vehicle.findOne({
      registrationNumber: registrationNumber.toUpperCase().trim(),
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Vehicle with registration '${registrationNumber}' is already registered.`,
      });
    }

    const vehicle = await Vehicle.create({
      registrationNumber: registrationNumber.toUpperCase().trim(),
      type,
      capacity,
      status: status || 'Available',
      modelName: modelName || '',
      fuelType: fuelType || 'Diesel',
    });

    res.status(201).json({
      success: true,
      message: 'Vehicle registered successfully',
      vehicle,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update vehicle details & status
 * @route   PUT /api/vehicles/:id
 * @access  Private (Admin, Dispatcher)
 */
export const updateVehicle = async (req, res, next) => {
  try {
    if (req.body.registrationNumber) {
      req.body.registrationNumber = req.body.registrationNumber.toUpperCase().trim();
    }

    const vehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Vehicle updated successfully',
      vehicle,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete vehicle
 * @route   DELETE /api/vehicles/:id
 * @access  Private (Admin)
 */
export const deleteVehicle = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found',
      });
    }

    // Check if vehicle has active bookings
    const activeBooking = await Booking.findOne({
      vehicleId: vehicle._id,
      status: { $in: ['Assigned', 'In-Transit'] },
    });

    if (activeBooking) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete vehicle currently assigned to an active trip.',
      });
    }

    await vehicle.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Vehicle deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
