import mongoose from 'mongoose';

const divisionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isPredefined: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Division = mongoose.model('Division', divisionSchema);
export default Division;

