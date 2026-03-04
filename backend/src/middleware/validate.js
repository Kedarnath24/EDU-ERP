const { body, validationResult } = require('express-validator');

/**
 * Reusable validation-error handler.
 * Attach it after express-validator check chains.
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

// ---------- Reusable validation chains ----------

const validateLogin = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Must be a valid email'),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  handleValidationErrors,
];

const validateForgotPassword = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Must be a valid email'),
  handleValidationErrors,
];

const validateCreateUser = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Must be a valid email'),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('role')
    .optional()
    .isIn(['admin', 'manager', 'member', 'viewer']).withMessage('Invalid role'),
  body('full_name')
    .optional()
    .trim()
    .notEmpty().withMessage('Name cannot be empty'),
  handleValidationErrors,
];

module.exports = {
  handleValidationErrors,
  validateLogin,
  validateForgotPassword,
  validateCreateUser,
};
