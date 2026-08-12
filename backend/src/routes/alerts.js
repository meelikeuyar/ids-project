const router = require('express').Router();
const alertController = require('../controllers/alertController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', alertController.getAlerts);
router.patch('/:id/read', alertController.markAsRead);
router.patch('/read-all', alertController.markAllAsRead);

module.exports = router;
