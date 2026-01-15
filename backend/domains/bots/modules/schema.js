/**
 * Bot Schema
 * Mongoose schema definition for Bot entity
 */

'use strict';

const mongoose = require('mongoose');
const { Schema } = mongoose;

// Valid status values
const VALID_STATUSES = ['DISABLED', 'ENABLED', 'PAUSED'];

const botSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  description: {
    type: String,
    default: null,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  status: {
    type: String,
    enum: {
      values: VALID_STATUSES,
      message: 'Status must be one of: DISABLED, ENABLED, PAUSED'
    },
    default: 'DISABLED',
    index: true
  },
  created: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: false,
  toJSON: {
    virtuals: true,
    transform: function(doc, ret) {
      ret.id = ret._id.toString();
      ret.created = ret.created.getTime();
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  },
  toObject: {
    virtuals: true,
    transform: function(doc, ret) {
      ret.id = ret._id.toString();
      ret.created = ret.created.getTime();
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Unique index for name (case-insensitive)
botSchema.index(
  { name: 1 },
  {
    unique: true,
    collation: { locale: 'en', strength: 2 }
  }
);

// Text index for search
botSchema.index({ name: 'text', description: 'text' });

// Virtual for id
botSchema.virtual('id').get(function() {
  return this._id.toString();
});

// Static method to check if name exists
botSchema.statics.nameExists = async function(name, excludeId = null) {
  const query = {
    name: { $regex: new RegExp(`^${name}$`, 'i') }
  };
  if (excludeId) {
    query._id = { $ne: excludeId };
  }
  const count = await this.countDocuments(query);
  return count > 0;
};

// Export constants
botSchema.statics.VALID_STATUSES = VALID_STATUSES;

const Bot = mongoose.model('Bot', botSchema);

module.exports = Bot;
