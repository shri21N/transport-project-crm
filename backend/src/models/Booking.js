import mongoose from 'mongoose';

const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      required: true,
      enum: ['Pending', 'Assigned', 'In-Transit', 'Delivered', 'Cancelled'],
    },
    changedAt: {
      type: Date,
      default: Date.now,
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    note: {
      type: String,
      default: '',
    },
  },
  { _id: false }
);

const bookingSchema = new mongoose.Schema(
  {
    bookingNumber: {
      type: String,
      unique: true,
      trim: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: [true, 'Please select a customer'],
    },
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      default: null,
    },
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Driver',
      default: null,
    },
    pickupLocation: {
      type: String,
      required: [true, 'Please provide a pickup location'],
      trim: true,
    },
    dropLocation: {
      type: String,
      required: [true, 'Please provide a drop location'],
      trim: true,
    },
    scheduledDate: {
      type: Date,
      required: [true, 'Please specify scheduled trip date'],
    },
    goodsDescription: {
      type: String,
      required: [true, 'Please provide description of goods to transport'],
      trim: true,
    },
    weight: {
      type: String,
      trim: true,
      default: '',
    },
    estimatedCost: {
      type: Number,
      required: [true, 'Please provide estimated cost for the trip'],
      min: [0, 'Estimated cost cannot be negative'],
    },
    status: {
      type: String,
      enum: {
        values: ['Pending', 'Assigned', 'In-Transit', 'Delivered', 'Cancelled'],
        message: '{VALUE} is not a valid booking status',
      },
      default: 'Pending',
    },
    statusHistory: [statusHistorySchema],
    specialInstructions: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Auto-generate booking number before save if not provided
bookingSchema.pre('save', function (next) {
  if (!this.bookingNumber) {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(100 + Math.random() * 900);
    this.bookingNumber = `TRP-${timestamp}-${random}`;
  }
  next();
});

bookingSchema.index({ customerId: 1 });
bookingSchema.index({ driverId: 1 });
bookingSchema.index({ vehicleId: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ scheduledDate: -1 });

const Booking = mongoose.model('Booking', bookingSchema);
export default Booking;
