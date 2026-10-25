import mongoose from 'mongoose';

const followUpSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: false
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  date: {
    type: Date,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  reminderBefore: {
    type: Number, // minutes before the event
    default: 30,
    enum: [15, 30, 60, 120, 1440] // 15min, 30min, 1hr, 2hr, 1day
  },
  reminderSent: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'blocked', 'completed', 'missed'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  assignedTo: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  subTasks: [{
    title: {
      type: String,
      required: true
    },
    isCompleted: {
      type: Boolean,
      default: false
    }
  }],
  comments: [{
    text: {
      type: String,
      required: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  timeline: [{
    status: {
      type: String,
      required: true
    },
    by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    at: {
      type: Date,
      default: Date.now
    }
  }],
  category: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
followUpSchema.index({ userId: 1, date: 1 });
followUpSchema.index({ userId: 1, status: 1 });
followUpSchema.index({ date: 1, time: 1 });
followUpSchema.index({ assignedTo: 1 });
followUpSchema.index({ category: 1 });

export default mongoose.model('FollowUp', followUpSchema);
