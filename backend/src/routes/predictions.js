const router = require('express').Router();
const multer = require('multer');
const predictionController = require('../controllers/predictionController');
const { authenticate, authorize } = require('../middleware/auth');
const { predictionLimiter } = require('../middleware/rateLimiter');
const { predictionValidators, logValidators } = require('../validators');
const validate = require('../middleware/validate');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed.'));
    }
  },
});

// All prediction routes require authentication
router.use(authenticate);

router.post(
  '/',
  predictionLimiter,
  predictionValidators.predict,
  validate,
  predictionController.predict
);

router.post(
  '/batch',
  authorize('analyst', 'admin'),
  upload.single('file'),
  predictionController.batchAnalysis
);

router.post(
  '/explain',
  predictionValidators.explain,
  validate,
  predictionController.getExplanation
);

router.get(
  '/logs',
  logValidators.getLogs,
  validate,
  predictionController.getLogs
);

router.get('/statistics', predictionController.getStatistics);
router.get('/trend', predictionController.getHourlyTrend);

router.delete(
  '/logs',
  authorize('admin'),
  predictionController.clearLogs
);

module.exports = router;