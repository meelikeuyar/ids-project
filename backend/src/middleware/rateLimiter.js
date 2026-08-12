const rateLimit = require('express-rate-limit');
const config = require('../config');

const globalLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests. Please try again later.',
  },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    error: 'Too many login attempts. Please try again in 15 minutes.',
  },
});

const predictionLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 60,
  message: {
    success: false,
    error: 'Prediction rate limit exceeded. Please slow down.',
  },
});

module.exports = { globalLimiter, authLimiter, predictionLimiter };
