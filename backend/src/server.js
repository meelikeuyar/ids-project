const app = require('./app');
const config = require('./config');
const connectDB = require('./config/database');
const logger = require('./utils/logger');

const startServer = async () => {
  await connectDB();

  app.listen(config.port, () => {
    logger.info(`🛡️  IDS Backend running on port ${config.port} [${config.env}]`);
    logger.info(`📡 ML Service URL: ${config.mlService.url}`);
  });
};

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully.');
  process.exit(0);
});

process.on('unhandledRejection', (err) => {
  logger.error('Unhandled rejection', { error: err.message, stack: err.stack });
  process.exit(1);
});

startServer();
