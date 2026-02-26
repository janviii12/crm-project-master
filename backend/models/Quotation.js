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
});

const Quotation = mongoose.model("Quotation", QuotationSchema);
export default Quotation;
