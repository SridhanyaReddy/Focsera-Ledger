import mongoose from 'mongoose';

const invoiceItemSchema = new mongoose.Schema(
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
    totalAmount: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  { _id: true }
);

const invoiceAdditionalChargeSchema = new mongoose.Schema(
  {
    description: { type: String, required: true },
    amount: { type: Number, required: true, default: 0 },
  },
  { _id: true }
);

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    invoiceType: {
      type: String,
      enum: [
        'Tax Invoice',
        'Bill of Supply',
        'Proforma Invoice',
        'Advance Invoice',
        'Final Invoice',
        'Credit Note',
        'Debit Note',
      ],
      default: 'Tax Invoice',
      required: true,
    },
    invoiceDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    dueDate: {
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
      required: true,
      index: true,
    },
    division: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Division',
      required: true,
      index: true,
    },
    placeOfSupply: {
      type: String,
      default: 'Telangana',
    },
    placeOfSupplyStateCode: {
      type: String,
      default: '36',
    },
    isInterState: {
      type: Boolean,
      default: false,
    },
    isReverseCharge: {
      type: Boolean,
      default: false,
    },
    items: [invoiceItemSchema],
    additionalCharges: [invoiceAdditionalChargeSchema],
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
    advanceAdjusted: {
      type: Number,
      default: 0,
    },
    paidAmount: {
      type: Number,
      default: 0,
    },
    outstandingBalance: {
      type: Number,
      required: true,
      default: 0,
    },
    status: {
      type: String,
      enum: [
        'Draft',
        'Issued',
        'Partially Paid',
        'Paid',
        'Overdue',
        'Cancelled',
        'Partially Refunded',
        'Refunded',
      ],
      default: 'Issued',
      index: true,
    },
    paymentTerms: {
      type: String,
      default: '',
    },
    notes: {
      type: String,
      default: '',
    },
    termsAndConditions: {
      type: [String],
      default: [],
    },
    quotationReference: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quotation',
    },
    originalInvoiceReference: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Invoice',
    },
    isLocked: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

invoiceSchema.index({ invoiceNumber: 'text', notes: 'text' });

const Invoice = mongoose.model('Invoice', invoiceSchema);
export default Invoice;

