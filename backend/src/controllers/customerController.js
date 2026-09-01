import Customer from '../models/Customer.js';
import Booking from '../models/Booking.js';
import Invoice from '../models/Invoice.js';

/**
 * @desc    Get all customers with search and pagination
 * @route   GET /api/customers
 * @access  Private (Admin, Dispatcher)
 */
export const getCustomers = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 50 } = req.query;
    let query = {};

    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { company: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ],
      };
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Customer.countDocuments(query);
    const customers = await Customer.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      count: customers.length,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      customers,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single customer details + booking history + payment stats
 * @route   GET /api/customers/:id
 * @access  Private (Admin, Dispatcher)
 */
export const getCustomerById = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }

    // Retrieve booking history
    const bookings = await Booking.find({ customerId: customer._id })
      .populate('vehicleId', 'registrationNumber type')
      .populate('driverId', 'name phone')
      .sort({ createdAt: -1 });

    // Retrieve invoices
    const invoices = await Invoice.find({ customerId: customer._id })
      .sort({ createdAt: -1 });

    const totalSpent = invoices
      .filter((inv) => inv.status === 'Paid')
      .reduce((sum, inv) => sum + inv.totalAmount, 0);

    res.status(200).json({
      success: true,
      customer,
      stats: {
        totalBookings: bookings.length,
        activeBookings: bookings.filter((b) => ['Pending', 'Assigned', 'In-Transit'].includes(b.status)).length,
        deliveredBookings: bookings.filter((b) => b.status === 'Delivered').length,
        totalSpent,
      },
      bookings,
      invoices,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new customer
 * @route   POST /api/customers
 * @access  Private (Admin, Dispatcher)
 */
export const createCustomer = async (req, res, next) => {
  try {
    const { name, company, phone, email, address, notes } = req.body;

    const customer = await Customer.create({
      name,
      company,
      phone,
      email,
      address,
      notes,
    });

    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      customer,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update customer
 * @route   PUT /api/customers/:id
 * @access  Private (Admin, Dispatcher)
 */
export const updateCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Customer updated successfully',
      customer,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete customer
 * @route   DELETE /api/customers/:id
 * @access  Private (Admin)
 */
export const deleteCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }

    // Check for existing bookings
    const bookingCount = await Booking.countDocuments({ customerId: customer._id });
    if (bookingCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete customer with ${bookingCount} linked bookings. Please archive or remove associated bookings first.`,
      });
    }

    await customer.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Customer deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
