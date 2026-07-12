const express = require('express');
const Joi = require('joi');
const rateLimit = require('express-rate-limit');
const validateRequest = require('../middleware/validationMiddleware');
const authController = require('../controllers/authController');

const router = express.Router();

// Define login rate limiter to prevent brute-force attacks (max 5 requests per 15 minutes per IP)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: {
    success: false,
    error: { message: 'Too many login attempts. Please try again after 15 minutes.' }
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Login schema validation
const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Invalid email format.',
    'any.required': 'Email is required.'
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Password must be at least 6 characters.',
    'any.required': 'Password is required.'
  })
});

// Register schema validation
const registerSchema = Joi.object({
  fullName: Joi.string().min(2).max(100).required().messages({
    'any.required': 'Full Name is required.'
  }),
  email: Joi.string().email().required().messages({
    'string.email': 'Invalid email format.',
    'any.required': 'Email is required.'
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Password must be at least 6 characters.',
    'any.required': 'Password is required.'
  }),
  roleName: Joi.string().valid('Fleet Manager', 'Dispatcher', 'Safety Officer', 'Financial Analyst', 'Driver').required().messages({
    'any.required': 'Role is required.'
  })
});

// Apply rate limiter and validation to the login route
router.post('/login', loginLimiter, validateRequest(loginSchema), authController.login);

// Mount register route
router.post('/register', validateRequest(registerSchema), authController.register);

module.exports = router;
