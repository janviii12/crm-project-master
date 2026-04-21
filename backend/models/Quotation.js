import mongoose from "mongoose";

const QuotationSchema = new mongoose.Schema({
  quotationNumber: { type: String, unique: true },
  serviceKey: { type: String, required: true },
  title: String,
  documents: mongoose.Schema.Types.Mixed,
  steps: [String],
  time: String,
  baseAmount: Number,
  gstPercent: { type: Number, default: 18 },
  totalAmount: Number,
  notes: { type: String, default: "" },
  clientName: String,
  societyName: String,
  executiveName: String,
  website: String,
  youtube: String,
  contactPhone: String,
  contactEmail: String,
  address: String,
  ownerName: String,
  paymentTerms: String,
  createdBy: String,
  lastEditedBy: String,
  createdAt: { type: Date, default: Date.now },
  history: [
    {
      editedBy: String,
      editedAt: { type: Date, default: Date.now },
      changes: Object,
    },
  ],
  // Uploaded file fields
  uploadedFile: {
    fileName: String,
    filePath: String,
    fileType: String,
    fileSize: Number,
    uploadedAt: { type: Date, default: Date.now },
    uploadedBy: String,
  },
});

const Quotation = mongoose.model("Quotation", QuotationSchema);
export default Quotation;
