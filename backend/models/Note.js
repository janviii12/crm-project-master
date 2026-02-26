import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sharedWith: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String }, // Optional: for role-based sharing
    permission: { type: String, enum: ['read', 'write'], required: true }
  }],
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Add indexes for better query performance
noteSchema.index({ createdBy: 1 }); // Index on createdBy for personal notes
noteSchema.index({ 'sharedWith.userId': 1 }); // Index on sharedWith for shared notes
noteSchema.index({ updatedAt: -1 }); // Index on updatedAt for sorting

export default mongoose.model('Note', noteSchema);
