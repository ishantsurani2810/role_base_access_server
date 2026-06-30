import mongoose from 'mongoose';
import { MODULES_LIST } from '../constants/modules.js';
import { ACTIONS_LIST } from '../constants/permissions.js';

const permissionOverrideSchema = new mongoose.Schema({
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

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email address']
  },
  password: {
    type: String,
    // Optional initially if status is Pending (accepting invitation sets password)
    required: function () { return this.status === 'Active'; },
    select: false // Exclude from standard queries for safety
  },
  roleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role',
    required: true
  },
  permissions: {
    type: [permissionOverrideSchema],
    default: undefined
  },
  status: {
    type: String,
    enum: ['Pending', 'Active', 'Disabled'],
    default: 'Pending'
  },
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true
});

// Avoid returning password hash in toJSON/toObject conversions
userSchema.set('toJSON', {
  transform: function (doc, ret) {
    delete ret.password;
    return ret;
  }
});

export const User = mongoose.model('User', userSchema);
