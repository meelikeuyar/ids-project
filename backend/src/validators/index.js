const { body, param, query } = require('express-validator');

const authValidators = {
  register: [
    body('name')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Name must be 2-50 characters'),
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain uppercase, lowercase and number'),
    // Prevent privilege escalation — users cannot self-assign roles
    body('role')
      .not()
      .exists()
      .withMessage('Role cannot be set during registration'),
  ],
  login: [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
};

const predictionValidators = {
  predict: [
    body('data')
      .isObject()
      .withMessage('Data must be an object')
      .notEmpty()
      .withMessage('Data cannot be empty'),
    body('modelType')
      .isIn(['1D-CNN', 'RF', 'XGB'])
      .withMessage('Model must be 1D-CNN, RF, or XGB'),
    body('ipAddress')
      .isIP(4)
      .withMessage('Valid IPv4 address is required'),
    body('preNormalized')
      .optional()
      .isBoolean()
      .withMessage('preNormalized must be boolean'),
  ],
  explain: [
    body('data')
      .isObject()
      .withMessage('Data must be an object')
      .notEmpty()
      .withMessage('Data cannot be empty'),
    body('preNormalized')
      .optional()
      .isBoolean()
      .withMessage('preNormalized must be boolean'),
  ],
  batchAnalysis: [
    body('modelType')
      .optional()
      .isIn(['1D-CNN', 'RF', 'XGB'])
      .withMessage('Model must be 1D-CNN, RF, or XGB'),
  ],
};

const logValidators = {
  getLogs: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 500 })
      .withMessage('Limit must be between 1 and 500'),
    query('prediction')
      .optional()
      .isIn(['BENIGN', 'DoS', 'BruteForce', 'PortScan', 'WebAttack'])
      .withMessage('Invalid prediction filter'),
  ],
};

const ipValidators = {
  manageIP: [
    param('ip')
      .isIP(4)
      .withMessage('Valid IPv4 address is required'),
  ],
  blockIP: [
    body('ipAddress')
      .isIP(4)
      .withMessage('Valid IPv4 address is required'),
    body('reason')
      .trim()
      .isLength({ min: 3, max: 200 })
      .withMessage('Reason must be 3-200 characters'),
    body('attackType')
      .isIn(['DoS', 'BruteForce', 'PortScan', 'WebAttack'])
      .withMessage('Invalid attack type'),
  ],
};

module.exports = { authValidators, predictionValidators, logValidators, ipValidators };