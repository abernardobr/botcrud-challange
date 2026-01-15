/**
 * Worker Schema
 * Mongoose schema definition for Worker entity
 */

'use strict';

const mongoose = require('mongoose');
const { Schema } = mongoose;

const workerSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters'],
    index: true
  },
  description: {
    type: String,
    default: null,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  bot: {
    type: Schema.Types.ObjectId,
    ref: 'Bot',
    required: [true, 'Bot reference is required'],
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
      ret.bot = ret.bot.toString();
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
      ret.bot = ret.bot.toString();
      ret.created = ret.created.getTime();
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Compound unique index for name within bot (case-insensitive)
workerSchema.index(
  { name: 1, bot: 1 },
  {
    unique: true,
    collation: { locale: 'en', strength: 2 }
  }
);

// Text index for search
workerSchema.index({ name: 'text', description: 'text' });

// Virtual for id
workerSchema.virtual('id').get(function() {
  return this._id.toString();
});

// Static method to check if name exists within a bot
workerSchema.statics.nameExistsInBot = async function(name, botId, excludeId = null) {
  const query = {
    name: { $regex: new RegExp(`^${name}$`, 'i') },
    bot: botId
  };
  if (excludeId) {
    query._id = { $ne: excludeId };
  }
  const count = await this.countDocuments(query);
  return count > 0;
};

// Static method to count workers for a bot
workerSchema.statics.countByBot = async function(botId) {
  return this.countDocuments({ bot: botId });
};

const Worker = mongoose.model('Worker', workerSchema);

module.exports = Worker;
