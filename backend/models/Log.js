import mongoose from 'mongoose';

const logSchema = new mongoose.Schema({
  userRole: { type: String, required: true },
  userName: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  documentName: { type: String, required: true },
  documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  action: { type: String, required: true, enum: ['Viewed', 'Downloaded'] },
  timestamp: { type: Date, default: Date.now },
  ipAddress: { type: String },
  deviceInfo: { type: String },
}, { timestamps: true });

// Add indexes for better query performance
logSchema.index({ timestamp: -1 }); // Index on timestamp for sorting (descending)
logSchema.index({ userId: 1 }); // Index on userId for filtering by user

export default mongoose.model('Log', logSchema);
