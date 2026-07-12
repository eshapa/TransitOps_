const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');
const reportController = require('../controllers/reportController');

const router = express.Router();

// Apply general Auth middleware to all routes
router.use(authMiddleware);

// Dashboard KPIs (Accessible to all authenticated roles)
router.get('/reports/dashboard-kpis', reportController.getDashboardKPIs);

// Analytics and Exports (Accessible to Fleet Manager and Financial Analyst only)
router.get('/reports/analytics', authorizeRoles('Fleet Manager', 'Financial Analyst'), reportController.getReportsAnalytics);
router.get('/reports/analytics/export-csv', authorizeRoles('Fleet Manager', 'Financial Analyst'), reportController.exportAnalyticsCSV);

module.exports = router;
