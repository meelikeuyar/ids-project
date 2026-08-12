const { Alert } = require('../models');

const getAlerts = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, type, isRead } = req.query;
    const filter = {};
    if (type) filter.type = type;
    if (isRead !== undefined) filter.isRead = isRead === 'true';

    const [alerts, total] = await Promise.all([
      Alert.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .lean(),
      Alert.countDocuments(filter),
    ]);

    const unreadCount = await Alert.countDocuments({ isRead: false });

    res.status(200).json({
      success: true,
      data: {
        alerts,
        unreadCount,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const alert = await Alert.findByIdAndUpdate(
      id,
      { isRead: true, readBy: req.user.id },
      { new: true }
    );
    if (!alert) {
      return res.status(404).json({ success: false, error: 'Alert not found.' });
    }
    res.status(200).json({ success: true, data: alert });
  } catch (error) {
    next(error);
  }
};

const markAllAsRead = async (req, res, next) => {
  try {
    await Alert.updateMany(
      { isRead: false },
      { isRead: true, readBy: req.user.id }
    );
    res.status(200).json({ success: true, message: 'All alerts marked as read.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAlerts, markAsRead, markAllAsRead };
