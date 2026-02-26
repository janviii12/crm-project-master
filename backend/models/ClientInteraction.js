import mongoose from 'mongoose';

const clientInteractionSchema = new mongoose.Schema({
  date: { type: Date, required: true, default: Date.now },
  clientName: { type: String, default: 'Unknown' },
  contactNumber: { type: String, default: 'Unknown' },
  clientStatus: {
    type: String,
    enum: ['existing', 'potential', 'closed-not-interested', 'closed-service-done'],
    default: 'potential'
  },
  interactionType: {
    type: String,
    required: true,
    enum: ['Call', 'WhatsApp', 'Email', 'Meeting']
  },
  handledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  notes: { type: String, default: '' },
  clientMessage: { type: String, default: '' }, // What the client said
  replyMessage: { type: String, default: '' }, // The response given to the client
  images: [{ type: String }] // Array of image file paths
}, { timestamps: true });

// Add indexes for better query performance
clientInteractionSchema.index({ date: -1 }); // Index on date for sorting (descending)
clientInteractionSchema.index({ clientName: 1 }); // Index on clientName for searching
clientInteractionSchema.index({ contactNumber: 1 }); // Index on contactNumber for searching
clientInteractionSchema.index({ clientStatus: 1 }); // Index on clientStatus for filtering
clientInteractionSchema.index({ handledBy: 1 }); // Index on handledBy for filtering

export default mongoose.model('ClientInteraction', clientInteractionSchema);
