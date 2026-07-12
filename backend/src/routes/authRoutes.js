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

// Apply rate limiter and validation to the login route
router.post('/login', loginLimiter, validateRequest(loginSchema), authController.login);

module.exports = router;
