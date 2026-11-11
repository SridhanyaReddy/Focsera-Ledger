import mongoose from 'mongoose';

const receiptSchema = new mongoose.Schema(
  {
    receiptNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    receiptDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      required: true,
      unique: true,
      index: true,
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
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    amountInWords: {
      type: String,
      required: true,
    },
    paymentMethod: {
      type: String,
      required: true,
    },
    transactionReference: {
      type: String,
      default: '',
    },
    remainingBalance: {
      type: Number,
      default: 0,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

receiptSchema.index({ receiptNumber: 'text', transactionReference: 'text' });

const Receipt = mongoose.model('Receipt', receiptSchema);
export default Receipt;

