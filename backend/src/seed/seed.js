import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

import User from '../models/User.js';
import Customer from '../models/Customer.js';
import Vehicle from '../models/Vehicle.js';
import Driver from '../models/Driver.js';
import Booking from '../models/Booking.js';
import Invoice from '../models/Invoice.js';
import NotificationLog from '../models/NotificationLog.js';

dotenv.config();

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/transport_crm';
    console.log(`🔌 Connecting to MongoDB: ${mongoUri.split('@')[1] || mongoUri}...`);
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB successfully.');

    console.log('🧹 Clearing existing collections...');
    await Promise.all([
      User.deleteMany(),
      Customer.deleteMany(),
      Vehicle.deleteMany(),
      Driver.deleteMany(),
      Booking.deleteMany(),
      Invoice.deleteMany(),
      NotificationLog.deleteMany(),
    ]);

    // 1. Seed 8 Drivers
    console.log('👨‍✈️ Seeding Drivers...');
    const driversData = [
      {
        name: 'Ramesh Kumar',
        licenseNumber: 'MH0420180091001',
        phone: '+919820011001',
        availabilityStatus: 'Available',
        address: 'Bhiwandi Truck Terminal, Thane, Maharashtra',
        emergencyContact: '+919820011002',
        experienceYears: 8,
      },
      {
        name: 'Suresh Patil',
        licenseNumber: 'MH1220190091002',
        phone: '+919820011003',
        availabilityStatus: 'On-Trip',
        address: 'Sector 19, Vashi, Navi Mumbai',
        emergencyContact: '+919820011004',
        experienceYears: 5,
      },
      {
        name: 'Gurpreet Singh',
        licenseNumber: 'PB0220150091003',
        phone: '+919820011005',
        availabilityStatus: 'Available',
        address: 'Transport Nagar, Ludhiana / Mumbai Depot',
        emergencyContact: '+919820011006',
        experienceYears: 12,
      },
      {
        name: 'Venkatesh Iyer',
        licenseNumber: 'TN0720170091004',
        phone: '+919820011007',
        availabilityStatus: 'On-Trip',
        address: 'Madhavaram Truck Terminal, Chennai',
        emergencyContact: '+919820011008',
        experienceYears: 6,
      },
      {
        name: 'Mohammed Aslam',
        licenseNumber: 'DL0120160091005',
        phone: '+919820011009',
        availabilityStatus: 'Available',
        address: 'Sanjay Gandhi Transport Nagar, Delhi',
        emergencyContact: '+919820011010',
        experienceYears: 9,
      },
      {
        name: 'Anil Yadav',
        licenseNumber: 'UP3220200091006',
        phone: '+919820011011',
        availabilityStatus: 'On-Trip',
        address: 'Transport Nagar, Kanpur',
        emergencyContact: '+919820011012',
        experienceYears: 4,
      },
      {
        name: 'Rajendra Prasad',
        licenseNumber: 'GJ0120180091007',
        phone: '+919820011013',
        availabilityStatus: 'Off-Duty',
        address: 'Aslali Bypass, Ahmedabad',
        emergencyContact: '+919820011014',
        experienceYears: 7,
      },
      {
        name: 'Harish Chandra',
        licenseNumber: 'KA0320140091008',
        phone: '+919820011015',
        availabilityStatus: 'Available',
        address: 'Yeshwanthpur Industrial Area, Bengaluru',
        emergencyContact: '+919820011016',
        experienceYears: 11,
      },
    ];

    const createdDrivers = await Driver.insertMany(driversData);

    // 2. Seed 3 Users (Admin, Dispatcher, Driver linked to Ramesh Kumar)
    console.log('👤 Seeding Users with hashed credentials...');
    const salt = await bcrypt.genSalt(10);
    const adminPassword = await bcrypt.hash('Admin@123', salt);
    const dispatcherPassword = await bcrypt.hash('Dispatcher@123', salt);
    const driverPassword = await bcrypt.hash('Driver@123', salt);

    const usersData = [
      {
        name: 'Administrator',
        email: 'admin@transportcrm.com',
        password: adminPassword,
        role: 'admin',
        isActive: true,
      },
      {
        name: 'Lead Dispatcher',
        email: 'dispatcher@transportcrm.com',
        password: dispatcherPassword,
        role: 'dispatcher',
        isActive: true,
      },
      {
        name: 'Ramesh Kumar (Pilot)',
        email: 'driver@transportcrm.com',
        password: driverPassword,
        role: 'driver',
        linkedDriverId: createdDrivers[0]._id,
        isActive: true,
      },
    ];

    // Use User.collection or bypass pre-save hook since password already hashed
    const createdUsers = await User.insertMany(usersData);

    // 3. Seed 10 Customers
    console.log('🏢 Seeding Customers...');
    const customersData = [
      {
        name: 'Rajesh Sharma',
        company: 'Reliance Retail Supply Chain',
        phone: '+919820199001',
        email: 'rajesh.sharma@relianceretail.com',
        address: 'Plot 45, MIDC Industrial Area, Andheri East, Mumbai 400093',
        notes: 'High-priority FMCG and electronics distributor',
      },
      {
        name: 'Vikram Singhania',
        company: 'Singhania Steel & Metals Ltd',
        phone: '+919820199002',
        email: 'vikram@singhaniasteel.com',
        address: 'Works Unit 3, Pimpri Chinchwad, Pune 411018',
        notes: 'Heavy structural steel girders and coils',
      },
      {
        name: 'Sunita Reddy',
        company: 'Reddy Pharma Logix',
        phone: '+919820199003',
        email: 'sunita@reddypharma.in',
        address: 'Genome Valley, Shamirpet, Hyderabad 500078',
        notes: 'Temperature-sensitive pharmaceutical products',
      },
      {
        name: 'Amitabh Sen',
        company: 'Bengal Tea Exporters Corp',
        phone: '+919820199004',
        email: 'amitabh.sen@bengaltea.com',
        address: 'Strand Road, Kolkata Port Area, Kolkata 700001',
        notes: 'Export grade CTC tea containers',
      },
      {
        name: 'Pooja Agarwal',
        company: 'Jaipur Textile Hub',
        phone: '+919820199005',
        email: 'pooja@jaipurtextiles.com',
        address: 'Sitapura Industrial Area, Jaipur 302022',
        notes: 'Bulk garment cartons for nationwide retail stores',
      },
      {
        name: 'Karthik Raman',
        company: 'Chennai Auto Components',
        phone: '+919820199006',
        email: 'karthik@chennaiauto.com',
        address: 'SIPCOT Industrial Park, Sriperumbudur, Tamil Nadu 602105',
        notes: 'Automotive engine spares and transmission gearboxes',
      },
      {
        name: 'Mahesh Patel',
        company: 'Gujarat Agro Chemicals',
        phone: '+919820199007',
        email: 'mahesh@gujaratagro.com',
        address: 'GIDC Industrial Estate, Ankleshwar, Gujarat 393002',
        notes: 'Organic agrochemical containers and fertilizers',
      },
      {
        name: 'Deepak Joshi',
        company: 'Himalayan Mineral Springs',
        phone: '+919820199008',
        email: 'deepak@himalayansprings.in',
        address: 'Selaqui Industrial Area, Dehradun 248011',
        notes: 'Packaged natural mineral water palettes',
      },
      {
        name: 'Ananya Deshmukh',
        company: 'Maharashtra Agricultural Produce',
        phone: '+919820199009',
        email: 'ananya@mahadroproduce.com',
        address: 'APMC Market Complex, Turbhe, Navi Mumbai 400705',
        notes: 'Fresh Alphonso Mango and onion consignments',
      },
      {
        name: 'Siddharth Roy',
        company: 'Eastern Paper Mills',
        phone: '+919820199010',
        email: 'siddharth@easternpaper.com',
        address: 'Bhubaneswar Industrial Zone, Odisha 751024',
        notes: 'Corrugated boxes and kraft paper reels',
      },
    ];

    const createdCustomers = await Customer.insertMany(customersData);

    // 4. Seed 15 Vehicles
    console.log('🚛 Seeding Vehicles...');
    const vehiclesData = [
      { registrationNumber: 'MH-04-AB-1001', type: 'Truck', capacity: '16 Tons', status: 'Available', modelName: 'Tata Signa 4825.TK', fuelType: 'Diesel' },
      { registrationNumber: 'MH-12-CD-2002', type: 'Trailer', capacity: '28 Tons', status: 'On-Trip', modelName: 'Ashok Leyland 4220 HG', fuelType: 'Diesel' },
      { registrationNumber: 'MH-43-EF-3003', type: 'Container', capacity: '20 Tons', status: 'Available', modelName: 'BharatBenz 2823R', fuelType: 'Diesel' },
      { registrationNumber: 'MH-01-GH-4004', type: 'Van', capacity: '3.5 Tons', status: 'Available', modelName: 'Tata Winger Cargo', fuelType: 'CNG' },
      { registrationNumber: 'MH-02-IJ-5005', type: 'Mini Truck', capacity: '2.5 Tons', status: 'On-Trip', modelName: 'Mahindra Bolero Maxi Truck', fuelType: 'Diesel' },
      { registrationNumber: 'MH-04-KL-6006', type: 'Pickup', capacity: '1.7 Tons', status: 'Available', modelName: 'Isuzu D-Max V-Cross', fuelType: 'Diesel' },
      { registrationNumber: 'DL-01-MN-7007', type: 'Truck', capacity: '12 Tons', status: 'On-Trip', modelName: 'Eicher Pro 3015', fuelType: 'Diesel' },
      { registrationNumber: 'KA-03-OP-8008', type: 'Trailer', capacity: '32 Tons', status: 'Available', modelName: 'Volvo FM 420 4x2', fuelType: 'Diesel' },
      { registrationNumber: 'TN-07-QR-9009', type: 'Container', capacity: '24 Tons', status: 'Available', modelName: 'Tata Prima 3530.K', fuelType: 'Diesel' },
      { registrationNumber: 'GJ-01-ST-1010', type: 'Truck', capacity: '14 Tons', status: 'Maintenance', modelName: 'Ashok Leyland Ecomet 1215', fuelType: 'Diesel' },
      { registrationNumber: 'MH-14-UV-1111', type: 'Mini Truck', capacity: '2.0 Tons', status: 'Available', modelName: 'Tata Ace Gold EV', fuelType: 'Electric' },
      { registrationNumber: 'TS-09-WX-1212', type: 'Van', capacity: '4.0 Tons', status: 'Available', modelName: 'Force Urbania Cargo', fuelType: 'Diesel' },
      { registrationNumber: 'WB-02-YZ-1313', type: 'Truck', capacity: '18 Tons', status: 'On-Trip', modelName: 'BharatBenz 3528C', fuelType: 'Diesel' },
      { registrationNumber: 'RJ-14-AA-1414', type: 'Container', capacity: '22 Tons', status: 'Available', modelName: 'Tata LPT 2818 Cowl', fuelType: 'Diesel' },
      { registrationNumber: 'UP-32-BB-1515', type: 'Trailer', capacity: '30 Tons', status: 'Maintenance', modelName: 'Ashok Leyland AVTR 4825', fuelType: 'Diesel' },
    ];

    const createdVehicles = await Vehicle.insertMany(vehiclesData);

    // 5. Seed 28 Bookings Across All Statuses
    console.log('📦 Seeding 28 Bookings across all workflows...');

    const tripRoutes = [
      { from: 'JNPT Port, Navi Mumbai', to: 'Chakan MIDC, Pune', goods: 'Auto Transmission Gearboxes', cost: 18500 },
      { from: 'Andheri Logistics Hub, Mumbai', to: 'Sanand Industrial Estate, Ahmedabad', goods: 'Consumer Electronics Cartons', cost: 32000 },
      { from: 'Bhiwandi Warehouse Zone, Thane', to: 'Peenya Industrial Area, Bengaluru', goods: 'FMCG & Packaged Foods', cost: 54000 },
      { from: 'Sriperumbudur SIPCOT, Chennai', to: 'Electronic City, Bengaluru', goods: 'Precision Machinery Parts', cost: 26000 },
      { from: 'Genome Valley, Hyderabad', to: 'Kurla West, Mumbai', goods: 'Medical Vaccines & Diagnostics', cost: 42000 },
      { from: 'Sitapura Industrial Area, Jaipur', to: 'Chandni Chowk, Old Delhi', goods: 'Textile Fabric Bundles', cost: 16500 },
      { from: 'Kolkata Port Docks, West Bengal', to: 'Bhubaneswar Industrial Park', goods: 'Steel Wire Coils & Hardware', cost: 28000 },
      { from: 'Ankleshwar GIDC, Gujarat', to: 'Tarapur MIDC, Palghar', goods: 'Organic Chemical Drums', cost: 21000 },
      { from: 'Turbhe APMC Market, Navi Mumbai', to: 'Azadpur Mandi, New Delhi', goods: 'Fresh Produce (Mangoes & Onions)', cost: 48000 },
      { from: 'Selaqui Industrial Zone, Dehradun', to: 'Connaught Place, New Delhi', goods: 'Mineral Water Bottled Cases', cost: 14500 },
    ];

    const bookingsToCreate = [];
    const statuses = [
      'Delivered', 'Delivered', 'Delivered', 'Delivered', 'Delivered',
      'Delivered', 'Delivered', 'Delivered', 'Delivered', 'Delivered',
      'In-Transit', 'In-Transit', 'In-Transit', 'In-Transit',
      'Assigned', 'Assigned', 'Assigned', 'Assigned',
      'Pending', 'Pending', 'Pending', 'Pending', 'Pending',
      'Cancelled', 'Cancelled', 'Delivered', 'Delivered', 'Delivered'
    ];

    const adminUserId = createdUsers[0]._id;

    for (let i = 0; i < statuses.length; i++) {
      const status = statuses[i];
      const route = tripRoutes[i % tripRoutes.length];
      const customer = createdCustomers[i % createdCustomers.length];
      const vehicle = status !== 'Pending' ? createdVehicles[i % createdVehicles.length] : null;
      const driver = status !== 'Pending' ? createdDrivers[i % createdDrivers.length] : null;

      const dateOffset = (statuses.length - i) * 2;
      const scheduledDate = new Date();
      scheduledDate.setDate(scheduledDate.getDate() - (status === 'Delivered' ? dateOffset : -dateOffset));

      const bookingNum = `TRP-202609-${String(i + 1).padStart(3, '0')}`;

      const history = [
        {
          status: 'Pending',
          changedAt: new Date(scheduledDate.getTime() - 86400000),
          changedBy: adminUserId,
          note: 'Consignment booked by shipper',
        },
      ];

      if (['Assigned', 'In-Transit', 'Delivered'].includes(status)) {
        history.push({
          status: 'Assigned',
          changedAt: new Date(scheduledDate.getTime() - 43200000),
          changedBy: adminUserId,
          note: `Assigned vehicle ${vehicle?.registrationNumber || ''} and pilot ${driver?.name || ''}`,
        });
      }

      if (['In-Transit', 'Delivered'].includes(status)) {
        history.push({
          status: 'In-Transit',
          changedAt: scheduledDate,
          changedBy: adminUserId,
          note: 'Consignment departed origin gate onto National Highway',
        });
      }

      if (status === 'Delivered') {
        history.push({
          status: 'Delivered',
          changedAt: new Date(scheduledDate.getTime() + 86400000),
          changedBy: adminUserId,
          note: 'Consignment safely delivered and acknowledged by consignee',
        });
      }

      if (status === 'Cancelled') {
        history.push({
          status: 'Cancelled',
          changedAt: new Date(scheduledDate.getTime() + 3600000),
          changedBy: adminUserId,
          note: 'Cancelled as requested by shipper',
        });
      }

      bookingsToCreate.push({
        bookingNumber: bookingNum,
        customerId: customer._id,
        vehicleId: vehicle ? vehicle._id : null,
        driverId: driver ? driver._id : null,
        pickupLocation: route.from,
        dropLocation: route.to,
        scheduledDate,
        goodsDescription: route.goods,
        weight: `${(i % 5) + 3} Tons`,
        estimatedCost: route.cost + (i * 500),
        status,
        statusHistory: history,
        specialInstructions: 'Handle with care. Fragile / time-critical consignment.',
      });
    }

    const createdBookings = await Booking.insertMany(bookingsToCreate);

    // 6. Seed Invoices for all Delivered Bookings (Mix of Paid and Unpaid)
    console.log('🧾 Seeding Invoices for delivered bookings...');
    const deliveredBookings = createdBookings.filter((b) => b.status === 'Delivered');
    const invoicesToCreate = [];

    for (let i = 0; i < deliveredBookings.length; i++) {
      const b = deliveredBookings[i];
      const isPaid = i % 3 !== 0; // 66% Paid, 33% Unpaid
      const baseAmount = b.estimatedCost;
      const taxRate = 18;
      const tax = Math.round((baseAmount * taxRate) / 100);
      const totalAmount = baseAmount + tax;
      const invoiceNumber = `INV-202609-${String(i + 1).padStart(3, '0')}`;

      invoicesToCreate.push({
        invoiceNumber,
        bookingId: b._id,
        customerId: b.customerId,
        amount: baseAmount,
        taxRate,
        tax,
        totalAmount,
        status: isPaid ? 'Paid' : 'Unpaid',
        paymentMethod: isPaid ? (i % 2 === 0 ? 'Razorpay' : 'Cash') : 'Razorpay',
        razorpayOrderId: isPaid ? `order_rzp_${Date.now()}_${i}` : null,
        razorpayPaymentId: isPaid ? `pay_rzp_${Date.now()}_${i}` : null,
        razorpaySignature: isPaid ? 'sig_rzp_mock_verified' : null,
        paidAt: isPaid ? new Date(b.scheduledDate.getTime() + 172800000) : null,
        dueDate: new Date(b.scheduledDate.getTime() + 604800000),
      });
    }

    await Invoice.insertMany(invoicesToCreate);

    // 7. Seed WhatsApp Notification Logs
    console.log('💬 Seeding WhatsApp Notification Logs...');
    const logsToCreate = [
      {
        recipientPhone: '+919820199001',
        recipientName: 'Rajesh Sharma',
        message: '🚚 *Transport CRM Booking Confirmation*\nYour booking #TRP-202609-001 has been confirmed!',
        type: 'Booking_Created',
        status: 'sent',
        errorMessage: null,
      },
      {
        recipientPhone: '+919820199002',
        recipientName: 'Vikram Singhania',
        message: '🚛 *Transport CRM Fleet Assigned*\nVehicle MH-12-CD-2002 assigned for trip #TRP-202609-002.',
        type: 'Trip_Assigned',
        status: 'sent',
        errorMessage: null,
      },
      {
        recipientPhone: '+919820199003',
        recipientName: 'Sunita Reddy',
        message: '🛣️ *Transport CRM Trip Dispatched (In-Transit)*\nYour consignment #TRP-202609-003 is currently in-transit.',
        type: 'Trip_InTransit',
        status: 'sent',
        errorMessage: null,
      },
      {
        recipientPhone: '+919820199004',
        recipientName: 'Amitabh Sen',
        message: '✅ *Transport CRM Consignment Delivered!*\nConsignment #TRP-202609-004 has arrived safely at destination.',
        type: 'Trip_Delivered',
        status: 'sent',
        errorMessage: null,
      },
      {
        recipientPhone: '+919820199001',
        recipientName: 'Rajesh Sharma',
        message: '💳 *Payment Confirmation - Transport CRM*\nPayment received of ₹21,830 for Invoice #INV-202609-001.',
        type: 'Payment_Received',
        status: 'sent',
        errorMessage: null,
      },
    ];

    await NotificationLog.insertMany(logsToCreate);

    console.log('\n======================================================');
    console.log('🎉 SEEDING COMPLETE! DEMO READY SYSTEM SUMMARY:');
    console.log('======================================================');
    console.log(`👤 Users Created:       3 (Admin, Dispatcher, Driver)`);
    console.log(`🏢 Customers Created:   ${createdCustomers.length}`);
    console.log(`🚛 Vehicles Created:    ${createdVehicles.length}`);
    console.log(`👨‍✈️ Drivers Created:     ${createdDrivers.length}`);
    console.log(`📦 Bookings Created:    ${createdBookings.length}`);
    console.log(`🧾 Invoices Created:    ${invoicesToCreate.length}`);
    console.log('------------------------------------------------------');
    console.log('DEMO CREDENTIALS:');
    console.log('👑 Admin:      admin@transportcrm.com      / Admin@123');
    console.log('📋 Dispatcher: dispatcher@transportcrm.com / Dispatcher@123');
    console.log('🚛 Driver:     driver@transportcrm.com     / Driver@123');
    console.log('======================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed with error:', error);
    process.exit(1);
  }
};

seedData();
