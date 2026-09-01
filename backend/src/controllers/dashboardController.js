import Booking from '../models/Booking.js';
import Vehicle from '../models/Vehicle.js';
import Driver from '../models/Driver.js';
import Customer from '../models/Customer.js';
import Invoice from '../models/Invoice.js';
import NotificationLog from '../models/NotificationLog.js';

/**
 * @desc    Get dashboard statistics, charts data, and activity feed
 * @route   GET /api/dashboard/metrics
 * @access  Private (Admin, Dispatcher)
 */
export const getDashboardMetrics = async (req, res, next) => {
  try {
    // 1. KPI Aggregates
    const [
      activeTripsCount,
      totalVehiclesCount,
      onTripVehiclesCount,
      availableVehiclesCount,
      maintenanceVehiclesCount,
      totalDriversCount,
      availableDriversCount,
      totalCustomersCount,
      unpaidInvoices,
      allInvoices,
      recentBookings,
    ] = await Promise.all([
      Booking.countDocuments({ status: { $in: ['Assigned', 'In-Transit'] } }),
      Vehicle.countDocuments(),
      Vehicle.countDocuments({ status: 'On-Trip' }),
      Vehicle.countDocuments({ status: 'Available' }),
      Vehicle.countDocuments({ status: 'Maintenance' }),
      Driver.countDocuments(),
      Driver.countDocuments({ availabilityStatus: 'Available' }),
      Customer.countDocuments(),
      Invoice.find({ status: 'Unpaid' }),
      Invoice.find(),
      Booking.find()
        .populate('customerId', 'name company')
        .populate('vehicleId', 'registrationNumber type')
        .populate('driverId', 'name')
        .sort({ updatedAt: -1 })
        .limit(8),
    ]);

    // Calculate revenue metrics
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const paidInvoicesThisMonth = allInvoices.filter(
      (inv) => inv.status === 'Paid' && inv.paidAt && new Date(inv.paidAt) >= startOfMonth
    );

    const monthlyRevenue = paidInvoicesThisMonth.reduce((acc, inv) => acc + inv.totalAmount, 0);
    const totalLifetimeRevenue = allInvoices
      .filter((inv) => inv.status === 'Paid')
      .reduce((acc, inv) => acc + inv.totalAmount, 0);

    const pendingInvoicesCount = unpaidInvoices.length;
    const pendingInvoicesAmount = unpaidInvoices.reduce((acc, inv) => acc + inv.totalAmount, 0);

    const fleetUtilization =
      totalVehiclesCount > 0
        ? Math.round((onTripVehiclesCount / totalVehiclesCount) * 100)
        : 0;

    // 2. Fleet Status Pie Chart Data
    const fleetStatusData = [
      { name: 'Available', value: availableVehiclesCount, color: '#10b981' },
      { name: 'On-Trip', value: onTripVehiclesCount, color: '#3b82f6' },
      { name: 'Maintenance', value: maintenanceVehiclesCount, color: '#f59e0b' },
    ].filter((item) => item.value > 0);

    // 3. Dynamic 6-Month Bookings & Revenue Time-Series Trend
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const [bookingTrendAgg, invoiceTrendAgg] = await Promise.all([
      Booking.aggregate([
        {
          $match: {
            $or: [
              { scheduledDate: { $gte: sixMonthsAgo } },
              { createdAt: { $gte: sixMonthsAgo } },
            ],
          },
        },
        {
          $group: {
            _id: {
              year: { $year: { $ifNull: ['$scheduledDate', '$createdAt'] } },
              month: { $month: { $ifNull: ['$scheduledDate', '$createdAt'] } },
            },
            count: { $sum: 1 },
          },
        },
      ]),
      Invoice.aggregate([
        {
          $match: {
            status: 'Paid',
            $or: [
              { paidAt: { $gte: sixMonthsAgo } },
              { createdAt: { $gte: sixMonthsAgo } },
            ],
          },
        },
        {
          $group: {
            _id: {
              year: { $year: { $ifNull: ['$paidAt', '$createdAt'] } },
              month: { $month: { $ifNull: ['$paidAt', '$createdAt'] } },
            },
            revenue: { $sum: '$totalAmount' },
          },
        },
      ]),
    ]);

    const currentYear = now.getFullYear();
    const bookingsByMonth = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - i);
      const year = d.getFullYear();
      const month = d.getMonth() + 1; // 1-12
      const monthLabel = `${monthNames[month - 1]}${year !== currentYear ? ` '${String(year).slice(-2)}` : ''}`;

      const bMatch = bookingTrendAgg.find((b) => b._id.year === year && b._id.month === month);
      const iMatch = invoiceTrendAgg.find((inv) => inv._id.year === year && inv._id.month === month);

      bookingsByMonth.push({
        name: monthLabel,
        bookings: bMatch ? bMatch.count : 0,
        revenue: iMatch ? iMatch.revenue : 0,
      });
    }

    // Build recent activities feed
    const activityFeed = recentBookings.map((b) => ({
      id: b._id,
      type: 'booking',
      title: `Consignment #${b.bookingNumber || b._id.toString().slice(-6)}`,
      description: `${b.pickupLocation} ➔ ${b.dropLocation} (${b.customerId?.name || 'Customer'})`,
      status: b.status,
      timestamp: b.updatedAt,
    }));

    res.status(200).json({
      success: true,
      summary: {
        activeTrips: activeTripsCount,
        monthlyRevenue,
        totalLifetimeRevenue,
        fleetUtilization,
        totalVehicles: totalVehiclesCount,
        availableVehicles: availableVehiclesCount,
        onTripVehicles: onTripVehiclesCount,
        totalDrivers: totalDriversCount,
        availableDrivers: availableDriversCount,
        totalCustomers: totalCustomersCount,
        pendingInvoicesCount,
        pendingInvoicesAmount,
      },
      charts: {
        fleetStatus: fleetStatusData,
        trend: bookingsByMonth,
      },
      recentActivity: activityFeed,
    });
  } catch (error) {
    next(error);
  }
};
