import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    paymentNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    transactionId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
      index: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      index: true,
    },
    invoice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Invoice',
      index: true,
    },
    paymentDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    allocatedAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    unallocatedAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    paymentMethod: {
      type: String,
      enum: ['UPI', 'Bank Transfer', 'NEFT', 'RTGS', 'IMPS', 'Cash', 'Cheque', 'Other'],
      default: 'UPI',
      required: true,
    },
    paymentType: {
      type: String,
      enum: ['Advance', 'Partial', 'Milestone', 'Full', 'Final Settlement', 'Refund', 'Reversal'],
      default: 'Full',
      required: true,
    },
    referenceNumber: {
      type: String,
      trim: true,
      default: '',
    },
    receipt: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Receipt',
    },
    notes: {
      type: String,
      default: '',
    },
    isReversed: {
      type: Boolean,
      default: false,
    },
    reversedByPaymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
    },
    originalPaymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
    },
  },
  {
    timestamps: true,
  }
);

paymentSchema.index({ paymentNumber: 'text', transactionId: 'text', referenceNumber: 'text', notes: 'text' });

const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;

