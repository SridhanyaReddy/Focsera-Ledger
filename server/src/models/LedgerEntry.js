import mongoose from 'mongoose';

const ledgerEntrySchema = new mongoose.Schema(
  {
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
    date: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    transactionId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    entryType: {
      type: String,
      enum: [
        'INVOICE_ISSUED',
        'PAYMENT_RECEIVED',
        'ADVANCE_RECEIVED',
        'ADVANCE_ALLOCATED',
        'CREDIT_NOTE',
        'DEBIT_NOTE',
        'REFUND_ISSUED',
        'ADJUSTMENT',
        'WRITE_OFF',
      ],
      required: true,
      index: true,
    },
    referenceDocumentType: {
      type: String,
      enum: ['Invoice', 'Payment', 'CreditNote', 'DebitNote', 'Adjustment'],
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
    description: {
      type: String,
      required: true,
      trim: true,
    },
    debit: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    credit: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    runningBalance: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

ledgerEntrySchema.index({ client: 1, date: 1, _id: 1 });
ledgerEntrySchema.index({ description: 'text', referenceNumber: 'text', transactionId: 'text' });

const LedgerEntry = mongoose.model('LedgerEntry', ledgerEntrySchema);
export default LedgerEntry;

