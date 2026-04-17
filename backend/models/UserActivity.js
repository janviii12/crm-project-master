import mongoose from 'mongoose';

const userActivitySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  activityType: {
    type: String,
    required: true,
enum: ['login', 'logout', 'token_refresh', 'customer_update', 'document_verify', 'task_update', 'chat_message', 'interaction_create', 'interaction_view', 'interaction_update', 'interaction_delete', 'interaction_image_upload', 'note_create', 'note_edit', 'note_share', 'note_delete', 'note_view', 'lunch_start', 'lunch_end', 'meeting_start', 'meeting_end', 'outside_work_start', 'outside_work_end', 'status_change']
  },
  description: { type: String },
  ipAddress: { type: String },
  userAgent: { type: String },
  metadata: { type: mongoose.Schema.Types.Mixed }, // For additional data like customerId, documentId, etc.
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model('UserActivity', userActivitySchema);
