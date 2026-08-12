const rateLimit = require('express-rate-limit');
const config = require('../config');

// Skip rate limiting in test environment
const isTest = config.env === 'test';

const globalLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  skip: () => isTest,
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
  skip: () => isTest,
  message: {
    success: false,
    error: 'Too many login attempts. Please try again in 15 minutes.',
  },
});

const predictionLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 60,
  skip: () => isTest,
  message: {
    success: false,
    error: 'Prediction rate limit exceeded. Please slow down.',
  },
});

module.exports = { globalLimiter, authLimiter, predictionLimiter };