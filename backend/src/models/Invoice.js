import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      unique: true,
      trim: true,
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: [true, 'Invoice must be linked to a booking'],
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: [true, 'Invoice must be linked to a customer'],
    },
    amount: {
      type: Number,
      required: [true, 'Base amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    taxRate: {
      type: Number,
      default: 18, // 18% standard GST
    },
    tax: {
      type: Number,
      default: 0,
      min: [0, 'Tax cannot be negative'],
    },
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: [0, 'Total amount cannot be negative'],
    },
    status: {
      type: String,
      enum: {
        values: ['Unpaid', 'Paid', 'Cancelled'],
        message: '{VALUE} is not a valid invoice status',
      },
      default: 'Unpaid',
    },
    paymentMethod: {
      type: String,
      enum: ['Razorpay', 'Cash', 'Bank Transfer', 'Other'],
      default: 'Razorpay',
    },
    razorpayOrderId: {
      type: String,
      default: null,
    },
    razorpayPaymentId: {
      type: String,
      default: null,
    },
    razorpaySignature: {
      type: String,
      default: null,
    },
    paidAt: {
      type: Date,
      default: null,
    },
    dueDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Auto-generate invoice number before save if not provided
invoiceSchema.pre('save', function (next) {
  if (!this.invoiceNumber) {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(100 + Math.random() * 900);
    this.invoiceNumber = `INV-${timestamp}-${random}`;
  }
  if (!this.dueDate) {
    // Default due date: 7 days after invoice creation
    const due = new Date();
    due.setDate(due.getDate() + 7);
    this.dueDate = due;
  }
  next();
});

invoiceSchema.index({ bookingId: 1 });
invoiceSchema.index({ customerId: 1 });
invoiceSchema.index({ status: 1 });
invoiceSchema.index({ razorpayOrderId: 1 });

const Invoice = mongoose.model('Invoice', invoiceSchema);
export default Invoice;
