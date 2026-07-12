const express = require('express');
const Joi = require('joi');
const validateRequest = require('../middleware/validationMiddleware');
const authMiddleware = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');
const fuelExpenseController = require('../controllers/fuelExpenseController');

const router = express.Router();

// Joi validation schemas
const fuelLogCreateSchema = Joi.object({
  vehicle_id: Joi.number().integer().positive().required(),
  trip_id: Joi.number().integer().positive().allow(null),
  liters: Joi.number().precision(2).positive().required(),
  price_per_liter: Joi.number().precision(2).positive().required(),
  total_cost: Joi.number().precision(2).positive().allow(null),
  odometer: Joi.number().precision(2).positive().allow(null),
  fuel_station: Joi.string().max(100).trim().allow('', null),
  filled_date: Joi.date().iso().allow(null)
});

const expenseCreateSchema = Joi.object({
  vehicle_id: Joi.number().integer().positive().allow(null),
  trip_id: Joi.number().integer().positive().allow(null),
  expense_type: Joi.string().valid('Fuel', 'Maintenance', 'Toll', 'Insurance', 'Repair', 'Other').required(),
  amount: Joi.number().precision(2).positive().required(),
  expense_date: Joi.date().iso().allow(null),
  description: Joi.string().max(1000).allow('', null)
});

// Auth check for all routes
router.use(authMiddleware);

// GET routes (All authenticated users)
router.get('/fuel', fuelExpenseController.getAllFuelLogs);
router.get('/expenses', fuelExpenseController.getAllExpenses);

// POST routes (Role checks)
router.post('/fuel', authorizeRoles('Fleet Manager', 'Driver'), validateRequest(fuelLogCreateSchema), fuelExpenseController.createFuelLog);
router.post('/expenses', authorizeRoles('Fleet Manager', 'Driver', 'Financial Analyst'), validateRequest(expenseCreateSchema), fuelExpenseController.createExpense);

module.exports = router;
