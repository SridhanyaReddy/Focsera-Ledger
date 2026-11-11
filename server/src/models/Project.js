import mongoose from 'mongoose';

const milestoneSchema = new mongoose.Schema(
  {
    milestoneId: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    percentage: {
      type: Number,
      default: 0,
    },
    amount: {
      type: Number,
      required: true,
      default: 0,
    },
    dueDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['Pending', 'Invoiced', 'Paid'],
      default: 'Pending',
    },
    notes: {
      type: String,
      default: '',
    },
  },
  { _id: true }
);

const projectSchema = new mongoose.Schema(
  {
    projectId: {
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
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
      index: true,
    },
    division: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Division',
      required: true,
      index: true,
    },
    serviceCategory: {
      type: String,
      trim: true,
      default: '',
    },
    description: {
      type: String,
      default: '',
    },
    startDate: {
      type: Date,
    },
    expectedCompletionDate: {
      type: Date,
    },
    agreedProjectValue: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    paymentTerms: {
      type: String,
      default: '',
    },
    milestones: [milestoneSchema],
    status: {
      type: String,
      enum: ['Enquiry', 'Quotation Sent', 'Approved', 'In Progress', 'On Hold', 'Completed', 'Cancelled'],
      default: 'In Progress',
      index: true,
    },
    internalNotes: {
      type: String,
      default: '',
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

projectSchema.index({ name: 'text', projectId: 'text' });

const Project = mongoose.model('Project', projectSchema);
export default Project;

