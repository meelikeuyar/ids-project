const mongoose = require('mongoose');

const predictionSchema = new mongoose.Schema(
  {
    ipAddress: {
      type: String,
      required: true,
      match: [/^(\d{1,3}\.){3}\d{1,3}$/, 'Invalid IP address format'],
      index: true,
    },
    model: {
      type: String,
      required: true,
      enum: ['1D-CNN', 'RF', 'XGB'],
    },
    prediction: {
      type: String,
      required: true,
      enum: ['BENIGN', 'DoS', 'BruteForce', 'PortScan', 'WebAttack'],
      index: true,
    },
    confidence: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    riskScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    responseTimeMs: {
      type: Number,
      required: true,
    },
    probabilities: {
      type: Map,
      of: Number,
    },
    blocked: {
      type: Boolean,
      default: false,
    },
    analystId: {
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

// Compound indexes for dashboard queries
predictionSchema.index({ createdAt: -1 });
predictionSchema.index({ prediction: 1, createdAt: -1 });
predictionSchema.index({ ipAddress: 1, createdAt: -1 });

module.exports = mongoose.model('Prediction', predictionSchema);
