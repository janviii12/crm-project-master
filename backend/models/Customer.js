import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
    type: { type: String },
    serviceType: {
        type: String,
        required: true
    },
    address: { type: String },
    files: [{
        filePath: { type: String },
        fileOriginalName: { type: String },
        uploadedAt: { type: Date, default: Date.now }
    }],
    status: {
        type: String,
        enum: ['pending', 'verified', 'rejected', 'on_hold'],
        default: 'pending'
    },
    remarks: { type: String },
    submittedAt: { type: Date },
}, { timestamps: true }); // timestamps adds createdAt and updatedAt fields

// Add indexes for better query performance
customerSchema.index({ email: 1 }); // Index on email for lookups
customerSchema.index({ status: 1 }); // Index on status for filtering

export default mongoose.model('Customer', customerSchema);
