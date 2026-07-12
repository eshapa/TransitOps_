const express = require('express');
const Joi = require('joi');
const validateRequest = require('../middleware/validationMiddleware');
const authMiddleware = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');
const maintenanceController = require('../controllers/maintenanceController');

const router = express.Router();

// Joi validation schemas
const maintenanceCreateSchema = Joi.object({
  vehicle_id: Joi.number().integer().positive().required(),
  maintenance_type: Joi.string().max(100).trim().allow('', null),
  description: Joi.string().max(1000).allow('', null),
  vendor: Joi.string().max(100).trim().allow('', null),
  cost: Joi.number().precision(2).min(0).allow(null),
  start_date: Joi.date().iso().allow(null),
  next_service_due: Joi.date().iso().allow(null),
  status: Joi.string().valid('Scheduled', 'In Progress', 'Completed').default('Scheduled')
});

const maintenanceCompleteSchema = Joi.object({
  completion_date: Joi.date().iso().allow(null),
  cost: Joi.number().precision(2).min(0).allow(null),
  next_service_due: Joi.date().iso().allow(null)
});

// Auth middleware for all routes
router.use(authMiddleware);

// GET routes (All users)
router.get('/', maintenanceController.getAllMaintenance);
router.get('/:id', maintenanceController.getMaintenanceById);

// Modifications (Fleet Manager only)
router.post('/', authorizeRoles('Fleet Manager'), validateRequest(maintenanceCreateSchema), maintenanceController.createMaintenance);
router.put('/:id/complete', authorizeRoles('Fleet Manager'), validateRequest(maintenanceCompleteSchema), maintenanceController.completeMaintenance);

module.exports = router;
