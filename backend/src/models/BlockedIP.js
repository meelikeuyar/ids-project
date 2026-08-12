const mongoose = require('mongoose');

const blockedIPSchema = new mongoose.Schema(
  {
    ipAddress: {
      type: String,
      required: true,
      unique: true,
      match: [/^(\d{1,3}\.){3}\d{1,3}$/, 'Invalid IP address format'],
    },
    reason: {
      type: String,
      required: true,
    },
    attackType: {
      type: String,
      enum: ['DoS', 'BruteForce', 'PortScan', 'WebAttack'],
      required: true,
    },
    confidence: {
      type: Number,
      required: true,
    },
    blockedBy: {
      type: String,
      enum: ['auto', 'manual'],
      default: 'auto',
    },
    blockedByUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    unblockedAt: {
      type: Date,
    },
    unblockedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);


blockedIPSchema.index({ isActive: 1 });

module.exports = mongoose.model('BlockedIP', blockedIPSchema);
