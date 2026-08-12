const router = require('express').Router();
const mlService = require('../services/mlService');

router.use('/auth', require('./auth'));
router.use('/predictions', require('./predictions'));
router.use('/blocked-ips', require('./blockedIPs'));
router.use('/alerts', require('./alerts'));

// Health check (public)
router.get('/health', async (req, res) => {
  const mlHealth = await mlService.healthCheck();
  res.status(200).json({
    success: true,
    data: {
      status: 'healthy',
      service: 'ids-backend',
      timestamp: new Date().toISOString(),
      mlService: mlHealth ? { status: mlHealth.status } : { status: 'unknown' },
    },
  });
});

module.exports = router;