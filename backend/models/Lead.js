import mongoose from 'mongoose';

const leadSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    source: { 
        type: String, 
        default: 'meta_ads',
        enum: ['meta_ads', 'website', 'call', 'walkin', 'referral']
    }
}, { timestamps: true }); // adds createdAt, updatedAt

// Indexes for performance
leadSchema.index({ email: 1 });
leadSchema.index({ source: 1 });
leadSchema.index({ createdAt: -1 });

export default mongoose.model('Lead', leadSchema);

