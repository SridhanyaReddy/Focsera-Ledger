import mongoose from 'mongoose';

const followUpSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['Meeting', 'Call Followup', 'Milestone Review', 'Project Note', 'Client Feedback', 'Design Discussion'],
      default: 'Meeting',
    },
    meetingDate: {
      type: Date,
      default: Date.now,
    },
    handlerName: {
      type: String,
      default: 'Project Lead',
      trim: true,
    },
    notes: {
      type: String,
      required: true,
      trim: true,
    },
    actionItems: {
      type: String,
      default: '',
      trim: true,
    },
    nextFollowUpDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['Completed', 'Scheduled', 'Pending Action'],
      default: 'Completed',
    },
  },
  { timestamps: true }
);

export default mongoose.model('FollowUp', followUpSchema);

