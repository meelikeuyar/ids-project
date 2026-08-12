const { BlockedIP } = require('../models');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

const getBlockedIPs = async (req, res, next) => {
  try {
    const { active } = req.query;
    const filter = {};
    if (active !== undefined) filter.isActive = active === 'true';

    const blockedIPs = await BlockedIP.find(filter)
      .sort({ createdAt: -1 })
      .populate('blockedByUser', 'name email')
      .populate('unblockedBy', 'name email');

    res.status(200).json({
      success: true,
      data: { blockedIPs, total: blockedIPs.length },
    });
  } catch (error) {
    next(error);
  }
};

const blockIP = async (req, res, next) => {
  try {
    const { ipAddress, reason, attackType } = req.body;

    const existing = await BlockedIP.findOne({ ipAddress, isActive: true });
    if (existing) {
      throw new AppError(`IP ${ipAddress} is already blocked.`, 409);
    }

    const blocked = await BlockedIP.create({
      ipAddress,
      reason,
      attackType,
      confidence: 100,
      blockedBy: 'manual',
      blockedByUser: req.user.id,
    });

    logger.info('IP manually blocked', {
      ipAddress,
      userId: req.user.id,
      reason,
    });

    res.status(201).json({ success: true, data: blocked });
  } catch (error) {
    next(error);
  }
};

const unblockIP = async (req, res, next) => {
  try {
    const { ip } = req.params;
    const blocked = await BlockedIP.findOne({ ipAddress: ip, isActive: true });

    if (!blocked) {
      throw new AppError(`IP ${ip} is not currently blocked.`, 404);
    }

    blocked.isActive = false;
    blocked.unblockedAt = new Date();
    blocked.unblockedBy = req.user.id;
    await blocked.save();

    logger.info('IP unblocked', { ipAddress: ip, userId: req.user.id });

    res.status(200).json({
      success: true,
      message: `IP ${ip} has been unblocked.`,
      data: blocked,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getBlockedIPs, blockIP, unblockIP };
