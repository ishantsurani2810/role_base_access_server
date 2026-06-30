import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  actorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // null if action not authenticated or generic system action
  },
  action: {
    type: String,
    required: true,
    index: true
  },
  module: {
    type: String,
    required: true,
    index: true
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  }
}, {
  timestamps: { createdAt: true, updatedAt: false } // Only track creation timestamp
});

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
