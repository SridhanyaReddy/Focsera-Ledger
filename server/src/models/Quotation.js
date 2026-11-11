import mongoose from 'mongoose';

const quotationItemSchema = new mongoose.Schema(
  {
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
    },
    serviceName: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    quantity: {
      type: Number,
      required: true,
      default: 1,
      min: 0.01,
    },
    unit: {
      type: String,
      default: 'units',
    },
    rate: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },
    taxPercentage: {
      type: Number,
      default: 0,
      min: 0,
    },
    taxableAmount: {
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
      default: 0,
    },
  },
  { _id: true }
);

const additionalChargeSchema = new mongoose.Schema(
  {
    description: { type: String, required: true },
    amount: { type: Number, required: true, default: 0 },
  },
  { _id: true }
);

const quotationSchema = new mongoose.Schema(
  {
    quotationNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    quotationDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    validUntil: {
      type: Date,
      required: true,
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
      index: true,
    },
    items: [quotationItemSchema],
    additionalCharges: [additionalChargeSchema],
    subtotal: {
      type: Number,
      required: true,
      default: 0,
    },
    itemDiscountTotal: {
      type: Number,
      default: 0,
    },
    invoiceDiscount: {
      type: Number,
      default: 0,
    },
    taxableAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    cgst: {
      type: Number,
      default: 0,
    },
    sgst: {
      type: Number,
      default: 0,
    },
    igst: {
      type: Number,
      default: 0,
    },
    totalTax: {
      type: Number,
      default: 0,
    },
    additionalChargesTotal: {
      type: Number,
      default: 0,
    },
    roundOff: {
      type: Number,
      default: 0,
    },
    grandTotal: {
      type: Number,
      required: true,
      default: 0,
    },
    paymentSchedule: {
      type: String,
      default: '',
    },
    exclusions: {
      type: [String],
      default: [],
    },
    termsAndConditions: {
      type: [String],
      default: [],
    },
    notes: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['Draft', 'Sent', 'Viewed', 'Accepted', 'Rejected', 'Expired', 'Converted'],
      default: 'Draft',
      index: true,
    },
    convertedToInvoice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Invoice',
    },
  },
  {
    timestamps: true,
  }
);

quotationSchema.index({ quotationNumber: 'text', notes: 'text' });

const Quotation = mongoose.model('Quotation', quotationSchema);
export default Quotation;

