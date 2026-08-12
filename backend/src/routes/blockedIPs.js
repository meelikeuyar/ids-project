const router = require('express').Router();
const blockedIPController = require('../controllers/blockedIPController');
const { authenticate, authorize } = require('../middleware/auth');
const { ipValidators } = require('../validators');
const validate = require('../middleware/validate');

router.use(authenticate);

router.get('/', blockedIPController.getBlockedIPs);

router.post(
  '/',
  authorize('analyst', 'admin'),
  ipValidators.blockIP,
  validate,
  blockedIPController.blockIP
);

router.delete(
  '/:ip',
  authorize('admin'),
  ipValidators.manageIP,
  validate,
  blockedIPController.unblockIP
);

module.exports = router;
