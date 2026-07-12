const express = require('express');
const Joi = require('joi');
const validateRequest = require('../middleware/validationMiddleware');
const authMiddleware = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');
const tripController = require('../controllers/tripController');

const router = express.Router();

// Joi schemas
const tripCreateSchema = Joi.object({
  vehicle_id: Joi.number().integer().positive().required(),
  driver_id: Joi.number().integer().positive().required(),
  source_location: Joi.string().max(255).trim().allow('', null),
  destination_location: Joi.string().max(255).trim().allow('', null),
  cargo_weight: Joi.number().precision(2).positive().required().messages({
    'any.required': 'Cargo weight is required.'
  }),
  planned_distance: Joi.number().precision(2).positive().allow(null),
  scheduled_start: Joi.date().iso().allow(null),
  remarks: Joi.string().max(1000).allow('', null),
  status: Joi.string().valid('Draft', 'Dispatched').default('Draft')
});

const tripCompleteSchema = Joi.object({
  end_odometer: Joi.number().precision(2).positive().required().messages({
    'any.required': 'End odometer reading is required to complete the trip.'
  }),
  actual_distance: Joi.number().precision(2).positive().allow(null),
  remarks: Joi.string().max(1000).allow('', null)
});

const tripCancelSchema = Joi.object({
  remarks: Joi.string().max(1000).allow('', null)
});

// Auth middleware for all routes
router.use(authMiddleware);

// GET routes (All users)
router.get('/', tripController.getAllTrips);
router.get('/:id', tripController.getTripById);

// Driver & Fleet Manager actions
router.post('/', authorizeRoles('Fleet Manager', 'Driver'), validateRequest(tripCreateSchema), tripController.createTrip);
router.put('/:id/dispatch', authorizeRoles('Fleet Manager', 'Driver'), tripController.dispatchTrip);
router.put('/:id/complete', authorizeRoles('Fleet Manager', 'Driver'), validateRequest(tripCompleteSchema), tripController.completeTrip);
router.put('/:id/cancel', authorizeRoles('Fleet Manager', 'Driver'), validateRequest(tripCancelSchema), tripController.cancelTrip);

module.exports = router;
