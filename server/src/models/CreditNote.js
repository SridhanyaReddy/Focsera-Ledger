import mongoose from 'mongoose';

const creditNoteSchema = new mongoose.Schema(
  {
    noteNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    noteDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    originalInvoice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Invoice',
      required: true,
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
      required: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    taxPercentage: {
      type: Number,
      default: 0,
    },
    taxAmount: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    status: {
      type: String,
      enum: ['Issued', 'Cancelled'],
      default: 'Issued',
    },
  },
  {
    timestamps: true,
  }
);

const CreditNote = mongoose.model('CreditNote', creditNoteSchema);
export default CreditNote;

