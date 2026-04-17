import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  roles: { type: [String], default: ['client'], validate: {
    validator: function(roles) {
      const validRoles = ['admin', 'manager', 'executive', 'client', 'developer'];
      return roles.every(role => validRoles.includes(role));
    },
    message: 'Invalid role provided'
  }},
  currentStatus: {
    type: String,
    enum: ['online', 'offline', 'lunch', 'meeting', 'outside_work'],
    default: 'offline'
  },
  isDevLead: { type: Boolean, default: false },
  isChatModerator: { type: Boolean, default: false },
  name: { type: String },
  avatar: { type: String },
  auditAttempts: { type: Number, default: 0 },
  lastAuditAttempt: { type: Date },
  refreshTokens: [{
    token: { type: String, required: true },
    expiresAt: { type: Date, required: true }
  }],
  pushSubscription: {
    endpoint: { type: String },
    keys: {
      p256dh: { type: String },
      auth: { type: String }
    }
  },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('User',userSchema);
