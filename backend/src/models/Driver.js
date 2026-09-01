import mongoose from 'mongoose';

const driverSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide driver full name'],
      trim: true,
      maxlength: [100, 'Driver name cannot exceed 100 characters'],
    },
    licenseNumber: {
      type: String,
      required: [true, 'Please provide driver commercial driving license number'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Please provide driver phone number'],
      trim: true,
    },
    availabilityStatus: {
      type: String,
      enum: {
        values: ['Available', 'On-Trip', 'Off-Duty'],
        message: '{VALUE} is not a valid driver availability status',
      },
      default: 'Available',
    },
    address: {
      type: String,
      trim: true,
      default: '',
    },
    emergencyContact: {
      type: String,
      trim: true,
      default: '',
    },
    experienceYears: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

driverSchema.index({ availabilityStatus: 1 });

const Driver = mongoose.model('Driver', driverSchema);
export default Driver;
