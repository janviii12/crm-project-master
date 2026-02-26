import mongoose from 'mongoose';

const AadhaarTempSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true },
  filePath: String,
  extractedData: Object,
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 600 // 🔥 auto-remove DB record after 10 min
  }
});

export default mongoose.model(
  'AadhaarTemp',
  AadhaarTempSchema
);
