import mongoose from 'mongoose';
import { MODULES_LIST } from '../constants/modules.js';
import { ACTIONS_LIST } from '../constants/permissions.js';

const permissionItemSchema = new mongoose.Schema({
  module: {
    type: String,
    enum: MODULES_LIST,
    required: true
  },
  actions: [{
    type: String,
    enum: ACTIONS_LIST,
    required: true
  }]
}, { _id: false });

const invitationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email address']
  },
  roleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role',
    required: true
  },
  permissions: [permissionItemSchema],
  token: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Accepted', 'Expired', 'Canceled'],
    default: 'Pending'
  },
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  expiresAt: {
    type: Date,
    required: true
  }
}, {
  timestamps: true
});

// Check if invitation is expired on access
invitationSchema.methods.isExpired = function() {
  return new Date() > this.expiresAt;
};

export const Invitation = mongoose.model('Invitation', invitationSchema);
