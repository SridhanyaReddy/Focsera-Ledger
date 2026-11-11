import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema(
  {
    expenseNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: [
        'Operations',
        'Salaries & Freelancers',
        'Marketing & Ads',
        'Software & Subscriptions',
        'Office & Equipment',
        'Travel & Lodging',
        'Vendor Payouts',
        'Utilities',
        'Taxes & Legal',
        'Miscellaneous',
      ],
      default: 'Operations',
      index: true,
    },
    division: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Division',
      index: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      index: true,
    },
    vendor: {
      type: String,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    expenseDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    paymentMethod: {
      type: String,
      enum: ['Bank Transfer', 'UPI', 'NEFT', 'RTGS', 'Cheque', 'Credit Card', 'Cash'],
      default: 'Bank Transfer',
    },
    referenceNumber: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['Paid', 'Pending'],
      default: 'Paid',
    },
  },
  { timestamps: true }
);

export default mongoose.model('Expense', expenseSchema);

