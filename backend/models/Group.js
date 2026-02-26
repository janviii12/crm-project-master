import mongoose from "mongoose";

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  lastMessageTime: {
    type: Date
  },
  groupType: {
    type: String,
    enum: ['direct', 'group'],
    default: 'group'
  }
});

// Index for efficient queries
groupSchema.index({ participants: 1 });
groupSchema.index({ createdBy: 1 });

export default mongoose.model('Group', groupSchema);
