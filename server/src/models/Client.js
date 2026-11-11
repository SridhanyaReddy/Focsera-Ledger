import mongoose from 'mongoose';

const clientSchema = new mongoose.Schema(
  {
    clientId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    businessName: {
      type: String,
      trim: true,
      default: '',
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    billingAddress: {
      street: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: 'Telangana' },
      stateCode: { type: String, default: '36' },
      postalCode: { type: String, default: '' },
      country: { type: String, default: 'India' },
    },
    gstin: {
      type: String,
      trim: true,
      uppercase: true,
      default: '',
    },
    state: {
      type: String,
      default: 'Telangana',
    },
    stateCode: {
      type: String,
      default: '36',
    },
    clientType: {
      type: String,
      enum: ['Individual', 'Business', 'Institution', 'Other'],
      default: 'Individual',
    },
    notes: {
      type: String,
      default: '',
    },
    openingBalance: {
      type: Number,
      default: 0,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

clientSchema.index({ name: 'text', businessName: 'text', phone: 'text', email: 'text', clientId: 'text' });

const Client = mongoose.model('Client', clientSchema);
export default Client;

