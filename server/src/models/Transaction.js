import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    transactionId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
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
    division: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Division',
      index: true,
    },
    category: {
      type: String,
      enum: ['Invoice', 'Payment', 'Advance', 'Allocation', 'Refund', 'Credit Note', 'Debit Note', 'Adjustment'],
      required: true,
      index: true,
    },
    referenceDocumentType: {
      type: String,
      enum: ['Invoice', 'Payment', 'Receipt', 'CreditNote', 'DebitNote', 'LedgerEntry'],
      required: true,
    },
    referenceDocumentId: {
      type: mongoose.Schema.Types.ObjectId,
      index: true,
    },
    referenceNumber: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    debit: {
      type: Number,
      default: 0,
      min: 0,
    },
    credit: {
      type: Number,
      default: 0,
      min: 0,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    paymentMethod: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

transactionSchema.index({ transactionId: 'text', referenceNumber: 'text', description: 'text' });

const Transaction = mongoose.model('Transaction', transactionSchema);
export default Transaction;

