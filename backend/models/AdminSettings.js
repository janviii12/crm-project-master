import mongoose from 'mongoose';

const adminSettingsSchema = new mongoose.Schema({
  auditPassword: { type: String, required: true }, // Hashed password
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model('AdminSettings', adminSettingsSchema);
