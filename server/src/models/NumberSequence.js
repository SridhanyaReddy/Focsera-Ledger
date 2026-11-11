import mongoose from 'mongoose';

const numberSequenceSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true, // e.g., 'INVOICE_2026-27', 'QUOTATION_2026-27', 'RECEIPT_2026-27', 'CLIENT', 'PROJECT'
      trim: true,
    },
    prefix: {
      type: String,
      required: true,
    },
    financialYear: {
      type: String,
      default: '',
    },
    lastSequence: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const NumberSequence = mongoose.model('NumberSequence', numberSequenceSchema);
export default NumberSequence;

