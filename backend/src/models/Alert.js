const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['critical', 'high', 'medium', 'low'],
      required: true,
      index: true,
    },
    attackType: {
      type: String,
      enum: ['DoS', 'BruteForce', 'PortScan', 'WebAttack'],
      required: true,
    },
    ipAddress: {
      type: String,
      required: true,
    },
    confidence: {
      type: Number,
      required: true,
    },
    riskScore: {
      type: Number,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    predictionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Prediction',
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    emailSent: {
      type: Boolean,
      default: false,
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

alertSchema.index({ createdAt: -1 });
alertSchema.index({ isRead: 1, type: 1 });

module.exports = mongoose.model('Alert', alertSchema);
