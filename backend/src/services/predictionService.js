const { Prediction, BlockedIP, Alert } = require('../models');
const mlService = require('./mlService');
const emailService = require('./emailService');
const logger = require('../utils/logger');

const ATTACK_WEIGHTS = {
  BENIGN: 0,
  PortScan: 3,
  BruteForce: 6,
  DoS: 10,
  WebAttack: 10,
};

const ALERT_THRESHOLDS = {
  DoS: { confidence: 80, type: 'critical' },
  WebAttack: { confidence: 80, type: 'critical' },
  BruteForce: { confidence: 85, type: 'high' },
  PortScan: { confidence: 90, type: 'medium' },
};

class PredictionService {
  calculateRiskScore(prediction, confidence) {
    const baseWeights = { BENIGN: 0, PortScan: 25, BruteForce: 55, DoS: 75, WebAttack: 85 };
    const base = baseWeights[prediction] || 30;
    const confFactor = confidence / 100;
    const score = Math.round(base * 0.6 + (confidence * 0.4));
    if (prediction === 'BENIGN') return 0;
    if (score >= 90) return Math.min(100, score);
    return Math.min(99, Math.max(5, score));
  }

  async predict({ data, modelType, ipAddress, preNormalized, analystId }) {
    const mlResult = await mlService.predict({ data, modelType, ipAddress, preNormalized });
    const riskScore = this.calculateRiskScore(mlResult.prediction, mlResult.confidence);

    const prediction = await Prediction.create({
      ipAddress,
      model: modelType,
      prediction: mlResult.prediction,
      confidence: mlResult.confidence,
      riskScore,
      responseTimeMs: mlResult.response_time_ms,
      probabilities: mlResult.probabilities,
      analystId,
    });

    let blocked = false;
    if (mlResult.prediction !== 'BENIGN') {
      const threshold = ALERT_THRESHOLDS[mlResult.prediction];
      if (threshold && mlResult.confidence >= threshold.confidence) {
        blocked = await this.autoBlockIP({
          ipAddress,
          attackType: mlResult.prediction,
          confidence: mlResult.confidence,
          predictionId: prediction._id,
          alertType: threshold.type,
          model: modelType,
        });
        if (blocked) {
          prediction.blocked = true;
          await prediction.save();
        }
      }
    }

    return {
      id: prediction.id,
      prediction: mlResult.prediction,
      confidence: mlResult.confidence,
      riskScore,
      responseTimeMs: mlResult.response_time_ms,
      probabilities: mlResult.probabilities,
      blocked,
      timestamp: prediction.createdAt,
    };
  }

  async autoBlockIP({ ipAddress, attackType, confidence, predictionId, alertType, model }) {
    const privateRanges = ['127.', '10.', '192.168.', '172.16.', '0.0.0.0'];
    if (privateRanges.some((r) => ipAddress.startsWith(r))) {
      logger.info('Skipping block for private IP', { ipAddress });
      await this.createAlert({
        type: alertType, attackType, ipAddress, confidence, predictionId,
        message: `${attackType} detected from private IP ${ipAddress} (not blocked)`,
      });
      // Send email even for private IPs
      await emailService.sendAlertEmail({
        attackType, ipAddress, confidence,
        riskScore: this.calculateRiskScore(attackType, confidence),
        model: model || 'Unknown',
      });
      return false;
    }

    const existing = await BlockedIP.findOne({ ipAddress, isActive: true });
    if (existing) return true;

    await BlockedIP.create({
      ipAddress,
      reason: `Auto-blocked: ${attackType} detected with ${confidence.toFixed(1)}% confidence`,
      attackType, confidence, blockedBy: 'auto',
    });

    await this.createAlert({
      type: alertType, attackType, ipAddress, confidence, predictionId,
      message: `${attackType} attack detected and IP ${ipAddress} auto-blocked`,
    });

    // Send email alert
    await emailService.sendAlertEmail({
      attackType, ipAddress, confidence,
      riskScore: this.calculateRiskScore(attackType, confidence),
      model: model || 'Unknown',
    });

    logger.warn('IP auto-blocked', { ipAddress, attackType, confidence });
    return true;
  }

  async createAlert({ type, attackType, ipAddress, confidence, predictionId, message }) {
    const riskScore = this.calculateRiskScore(attackType, confidence);
    await Alert.create({ type, attackType, ipAddress, confidence, riskScore, message, predictionId });
  }

  async getLogs({ page = 1, limit = 50, prediction, ipAddress, startDate, endDate }) {
    const filter = {};
    if (prediction) filter.prediction = prediction;
    if (ipAddress) filter.ipAddress = ipAddress;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }
    const [logs, total] = await Promise.all([
      Prediction.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Prediction.countDocuments(filter),
    ]);
    return { logs, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async getStatistics() {
    const [total, attackCounts, modelCounts, avgResponse, recentAttacks] = await Promise.all([
      Prediction.countDocuments(),
      Prediction.aggregate([{ $group: { _id: '$prediction', count: { $sum: 1 } } }]),
      Prediction.aggregate([{ $group: { _id: '$model', count: { $sum: 1 } } }]),
      Prediction.aggregate([{ $group: { _id: null, avg: { $avg: '$responseTimeMs' } } }]),
      Prediction.aggregate([
        { $match: { prediction: { $ne: 'BENIGN' }, createdAt: { $gte: new Date(Date.now() - 86400000) } } },
        { $count: 'count' },
      ]),
    ]);
    const classDistribution = {};
    attackCounts.forEach((a) => { classDistribution[a._id] = a.count; });
    const modelDistribution = {};
    modelCounts.forEach((m) => { modelDistribution[m._id] = m.count; });
    return {
      totalPredictions: total, classDistribution, modelDistribution,
      avgResponseMs: avgResponse[0]?.avg ? Math.round(avgResponse[0].avg * 100) / 100 : 0,
      last24hAttacks: recentAttacks[0]?.count || 0,
    };
  }

  async getHourlyTrend(hours = 24) {
    const since = new Date(Date.now() - hours * 3600000);
    const trend = await Prediction.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: {
        _id: { hour: { $hour: '$createdAt' }, date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } } },
        total: { $sum: 1 },
        attacks: { $sum: { $cond: [{ $ne: ['$prediction', 'BENIGN'] }, 1, 0] } },
      }},
      { $sort: { '_id.date': 1, '_id.hour': 1 } },
    ]);
    return trend.map((t) => ({
      hour: `${t._id.date} ${String(t._id.hour).padStart(2, '0')}:00`,
      total: t.total, attacks: t.attacks,
    }));
  }

  async clearLogs() {
    const result = await Prediction.deleteMany({});
    logger.info('Prediction logs cleared', { count: result.deletedCount });
    return { deletedCount: result.deletedCount };
  }
}

module.exports = new PredictionService();
