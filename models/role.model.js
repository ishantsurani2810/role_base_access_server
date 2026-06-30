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

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  permissions: [permissionItemSchema]
}, {
  timestamps: true
});

// Case insensitive query helpers for name
roleSchema.pre('validate', function(next) {
  if (this.name) {
    // Normalize casing for standards
    this.name = this.name.charAt(0).toUpperCase() + this.name.slice(1).toLowerCase();
  }
  next();
});

export const Role = mongoose.model('Role', roleSchema);
