const express = require('express');
const Joi = require('joi');
const validateRequest = require('../middleware/validationMiddleware');
const authMiddleware = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');
const vehicleController = require('../controllers/vehicleController');

const router = express.Router();

// Vehicle validation schemas
const vehicleCreateSchema = Joi.object({
  registration_number: Joi.string().max(30).trim().required().messages({
    'any.required': 'Registration number is required.'
  }),
  vehicle_name: Joi.string().max(100).trim().allow('', null),
  vehicle_model: Joi.string().max(100).trim().allow('', null),
  vehicle_type: Joi.string().max(50).trim().allow('', null),
  manufacturer: Joi.string().max(100).trim().allow('', null),
  manufacture_year: Joi.number().integer().min(1900).max(2100).allow(null),
  maximum_load_capacity: Joi.number().precision(2).positive().required().messages({
    'any.required': 'Maximum load capacity is required.'
  }),
  fuel_type: Joi.string().valid('Petrol', 'Diesel', 'Electric', 'CNG').required().messages({
    'any.required': 'Fuel type is required.',
    'any.only': 'Fuel type must be Petrol, Diesel, Electric, or CNG.'
  }),
  current_odometer: Joi.number().precision(2).min(0).default(0),
  purchase_date: Joi.date().iso().allow(null),
  acquisition_cost: Joi.number().precision(2).min(0).allow(null),
  insurance_expiry: Joi.date().iso().allow(null),
  pollution_expiry: Joi.date().iso().allow(null),
  fitness_expiry: Joi.date().iso().allow(null),
  status: Joi.string().valid('Available', 'On Trip', 'In Shop', 'Retired').default('Available')
});

const vehicleUpdateSchema = Joi.object({
  registration_number: Joi.string().max(30).trim(),
  vehicle_name: Joi.string().max(100).trim().allow('', null),
  vehicle_model: Joi.string().max(100).trim().allow('', null),
  vehicle_type: Joi.string().max(50).trim().allow('', null),
  manufacturer: Joi.string().max(100).trim().allow('', null),
  manufacture_year: Joi.number().integer().min(1900).max(2100).allow(null),
  maximum_load_capacity: Joi.number().precision(2).positive(),
  fuel_type: Joi.string().valid('Petrol', 'Diesel', 'Electric', 'CNG'),
  current_odometer: Joi.number().precision(2).min(0),
  purchase_date: Joi.date().iso().allow(null),
  acquisition_cost: Joi.number().precision(2).min(0).allow(null),
  insurance_expiry: Joi.date().iso().allow(null),
  pollution_expiry: Joi.date().iso().allow(null),
  fitness_expiry: Joi.date().iso().allow(null),
  status: Joi.string().valid('Available', 'On Trip', 'In Shop', 'Retired')
}).min(1); // At least one field must be updated

// Apply general Auth middleware to all routes
router.use(authMiddleware);

// GET routes (Accessible to all roles)
router.get('/', vehicleController.getAllVehicles);
router.get('/:id', vehicleController.getVehicleById);

// Modifications (Accessible to Fleet Manager only)
router.post('/', authorizeRoles('Fleet Manager'), validateRequest(vehicleCreateSchema), vehicleController.createVehicle);
router.put('/:id', authorizeRoles('Fleet Manager'), validateRequest(vehicleUpdateSchema), vehicleController.updateVehicle);
router.delete('/:id', authorizeRoles('Fleet Manager'), vehicleController.deleteVehicle);

module.exports = router;
