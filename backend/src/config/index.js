const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5000,

  // MongoDB
  mongo: {
    uri: process.env.MONGO_URI || 'mongodb://localhost:27017/ids_db',
    options: {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    },
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'CHANGE_ME_IN_PRODUCTION',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES || '1h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES || '7d',
  },

  // ML Service
  mlService: {
    url: process.env.ML_SERVICE_URL || 'http://localhost:8000',
    timeout: parseInt(process.env.ML_TIMEOUT, 10) || 30000,
  },

  // Email (SMTP)
  email: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT, 10) || 465,
    secure: true,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    alertRecipient: process.env.ALERT_EMAIL,
  },

  // CORS
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  },

  // Rate Limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 min
    max: 100,
  },

  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
};

// Validation
const requiredInProduction = ['JWT_SECRET', 'MONGO_URI'];
if (config.env === 'production') {
  for (const key of requiredInProduction) {
    if (!process.env[key]) {
      throw new Error(`Missing required env variable: ${key}`);
    }
  }
}

module.exports = config;
