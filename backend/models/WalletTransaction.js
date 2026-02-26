import mongoose from 'mongoose';

const walletTransactionSchema = new mongoose.Schema({
  managerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['credit', 'debit'] // credit = money added, debit = money spent
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'bank_transfer', 'cheque', 'other'],
    default: 'cash'
  },
  bill: {
    filePath: String,
    fileOriginalName: String,
    uploadedAt: Date
  },
  reference: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ManagerExpense' // For debit transactions, link to expense
  },
  balanceBefore: {
    type: Number,
    required: true
  },
  balanceAfter: {
    type: Number,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Add indexes for better query performance
walletTransactionSchema.index({ managerId: 1, createdAt: -1 });

export default mongoose.model('WalletTransaction', walletTransactionSchema);
