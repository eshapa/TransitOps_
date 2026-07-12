const express = require('express');
const Joi = require('joi');
const validateRequest = require('../middleware/validationMiddleware');
const authMiddleware = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');
const driverController = require('../controllers/driverController');

const router = express.Router();

// Driver Joi validation schemas
const driverCreateSchema = Joi.object({
  full_name: Joi.string().max(100).trim().required().messages({
    'any.required': 'Driver full name is required.'
  }),
  email: Joi.string().email().max(100).trim().required().messages({
    'any.required': 'Driver email is required.',
    'string.email': 'Invalid email format.'
  }),
  password: Joi.string().min(6).max(50).required().messages({
    'any.required': 'Password is required for driver login.',
    'string.min': 'Password must be at least 6 characters.'
  }),
  phone: Joi.string().max(20).trim().allow(null, ''),
  license_number: Joi.string().max(50).trim().required().messages({
    'any.required': 'License number is required.'
  }),
  license_category: Joi.string().max(20).trim().allow(null, ''),
  license_expiry: Joi.date().iso().required().messages({
    'any.required': 'License expiry date is required.'
  }),
  joining_date: Joi.date().iso().allow(null),
  status: Joi.string().valid('Available', 'On Trip', 'Off Duty', 'Suspended').default('Available')
});

const driverUpdateSchema = Joi.object({
  full_name: Joi.string().max(100).trim(),
  email: Joi.string().email().max(100).trim(),
  phone: Joi.string().max(20).trim().allow(null, ''),
  user_status: Joi.string().valid('Active', 'Inactive'),
  license_number: Joi.string().max(50).trim(),
  license_category: Joi.string().max(20).trim().allow(null, ''),
  license_expiry: Joi.date().iso(),
  safety_score: Joi.number().precision(2).min(0).max(100),
  status: Joi.string().valid('Available', 'On Trip', 'Off Duty', 'Suspended')
}).min(1);

// Self-update schema (drivers can only change their own info and status)
const driverSelfUpdateSchema = Joi.object({
  full_name: Joi.string().max(100).trim(),
  email: Joi.string().email().max(100).trim(),
  phone: Joi.string().max(20).trim().allow(null, ''),
  status: Joi.string().valid('Available', 'Off Duty')
}).min(1);

// Apply auth check
router.use(authMiddleware);

// GET routes (Accessible to all authenticated users)
router.get('/', driverController.getAllDrivers);
router.get('/:id', driverController.getDriverById);

// Self-update route (Driver updating their own profile / status)
router.put('/me/update', authorizeRoles('Driver'), validateRequest(driverSelfUpdateSchema), driverController.selfUpdateDriver);

// Create / Update routes (Accessible to Fleet Manager and Safety Officer only)
router.post('/', authorizeRoles('Fleet Manager', 'Safety Officer'), validateRequest(driverCreateSchema), driverController.createDriver);
router.put('/:id', authorizeRoles('Fleet Manager', 'Safety Officer'), validateRequest(driverUpdateSchema), driverController.updateDriver);

module.exports = router;
