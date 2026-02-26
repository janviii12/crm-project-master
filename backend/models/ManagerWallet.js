import mongoose from 'mongoose';

const managerWalletSchema = new mongoose.Schema({
  managerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  totalReceived: {
    type: Number,
    default: 0,
    min: 0
  },
  totalSpent: {
    type: Number,
    default: 0,
    min: 0
  },
  balance: {
    type: Number,
    default: 0
  },
  lastSettlementDate: {
    type: Date,
    default: null
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

// Add indexes for better query performance (removed duplicate index)

// Pre-save middleware to calculate balance
managerWalletSchema.pre('save', function(next) {
  this.balance = this.totalReceived - this.totalSpent;
  this.updatedAt = new Date();
  next();
});

export default mongoose.model('ManagerWallet', managerWalletSchema);
