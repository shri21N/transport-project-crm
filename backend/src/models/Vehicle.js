import mongoose from 'mongoose';

const vehicleSchema = new mongoose.Schema(
  {
    registrationNumber: {
      type: String,
      required: [true, 'Please provide vehicle registration number'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    type: {
      type: String,
      required: [true, 'Please specify vehicle type'],
      enum: {
        values: ['Truck', 'Trailer', 'Van', 'Container', 'Mini Truck', 'Pickup'],
        message: '{VALUE} is not a supported vehicle type',
      },
    },
    capacity: {
      type: String,
      required: [true, 'Please specify vehicle load capacity (e.g. 10 Tons)'],
      trim: true,
    },
    status: {
      type: String,
      enum: {
        values: ['Available', 'On-Trip', 'Maintenance'],
        message: '{VALUE} is not a valid vehicle status',
      },
      default: 'Available',
    },
    modelName: {
      type: String,
      trim: true,
      default: '',
    },
    fuelType: {
      type: String,
      enum: ['Diesel', 'CNG', 'Electric', 'Petrol'],
      default: 'Diesel',
    },
  },
  {
    timestamps: true,
  }
);

vehicleSchema.index({ status: 1 });
vehicleSchema.index({ type: 1 });

const Vehicle = mongoose.model('Vehicle', vehicleSchema);
export default Vehicle;
