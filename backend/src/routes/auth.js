const router = require('express').Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const { authValidators } = require('../validators');
const validate = require('../middleware/validate');

router.post('/register', authLimiter, authValidators.register, validate, authController.register);
router.post('/login', authLimiter, authValidators.login, validate, authController.login);
router.post('/refresh-token', authLimiter, authController.refreshToken);
router.post('/logout', authenticate, authController.logout);
router.get('/profile', authenticate, authController.getProfile);

module.exports = router;