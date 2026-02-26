import mongoose from "mongoose";

const excelFileSchema = new mongoose.Schema({
  fileName: { type: String, required: true },
  originalFileName: { type: String, required: true },
  filePath: { type: String, required: true },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  uploadedAt: { type: Date, default: Date.now },
  lastUpdatedAt: { type: Date, default: Date.now },
  version: { type: Number, default: 1 },
  fileSize: { type: Number, required: true },
  mimeType: { type: String, required: true },
  notes: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }],
  history: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, enum: ['upload', 'edit', 'delete'], required: true },
    timestamp: { type: Date, default: Date.now },
    changes: { type: String }, // Optional description of changes
    version: { type: Number, required: true }
  }]
});

export default mongoose.model('ExcelFile', excelFileSchema);
