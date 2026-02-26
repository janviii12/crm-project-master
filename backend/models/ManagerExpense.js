import mongoose from 'mongoose';

const managerExpenseSchema = new mongoose.Schema({
  managerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    required: true,
    enum: ['Tea', 'Snacks', 'Diesel', 'Stationery', 'Travel', 'Misc']
  },
  description: {
    type: String,
    trim: true
  },
  paymentType: {
    type: String,
    required: true,
    enum: ['Wallet', 'Personal']
  },
  bill: {
    filePath: { type: String },
    fileOriginalName: { type: String },
    uploadedAt: { type: Date, default: Date.now }
  },
  date: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Add indexes for better query performance
managerExpenseSchema.index({ managerId: 1, date: -1 });
managerExpenseSchema.index({ category: 1 });
managerExpenseSchema.index({ paymentType: 1 });

// Virtual for checking if bill is missing
managerExpenseSchema.virtual('isBillMissing').get(function() {
  return !this.bill || !this.bill.filePath;
});

export default mongoose.model('ManagerExpense', managerExpenseSchema);
