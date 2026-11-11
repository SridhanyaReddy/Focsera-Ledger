import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    division: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Division',
      required: true,
      index: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    defaultRate: {
      type: Number,
      default: 0,
      min: 0,
    },
    unitType: {
      type: String,
      default: 'service', // e.g. 'per event', 'per day', 'per hour', 'per project', 'per sq.ft'
      trim: true,
    },
    taxPercentage: {
      type: Number,
      default: 18,
    },
    notes: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

serviceSchema.index({ name: 'text', category: 'text' });

const Service = mongoose.model('Service', serviceSchema);
export default Service;

