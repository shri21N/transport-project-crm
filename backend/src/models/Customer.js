import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a customer name'],
      trim: true,
      maxlength: [100, 'Customer name cannot exceed 100 characters'],
    },
    company: {
      type: String,
      trim: true,
      default: '',
    },
    phone: {
      type: String,
      required: [true, 'Please provide a phone number with country code (e.g. +919876543210)'],
      trim: true,
      match: [
        /^\+[1-9]\d{6,14}$/,
        'Phone number must include country code in E.164 format (e.g. +919876543210)',
      ],
    },
    email: {
      type: String,
      required: [true, 'Please provide an email address'],
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
    },
    address: {
      type: String,
      required: [true, 'Please provide a billing / primary address'],
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
customerSchema.index({ phone: 1 });
customerSchema.index({ email: 1 });
customerSchema.index({ name: 'text', company: 'text' });

const Customer = mongoose.model('Customer', customerSchema);
export default Customer;
