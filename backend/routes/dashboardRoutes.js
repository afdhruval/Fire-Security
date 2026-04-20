/**
 * Dashboard Routes — FireSentrix
 *
 * All authenticated users (CEO, HR, Employee) can access these routes.
 * Role-specific filtering is handled inside the controller.
 *
 * Routes:
 *   GET /api/v1/dashboard/summary        → full dashboard stats (role-filtered)
 *   GET /api/v1/dashboard/on-duty-force  → on-duty guard count (safe, always returns number)
 */

const express    = require('express');
const router     = express.Router();
const { protect } = require('../middleware/auth');
const { getSummary, getOnDutyForce, getOnDutyGuards } = require('../controllers/dashboardController');

// All authenticated users can access dashboard endpoints
router.get('/summary',        protect, getSummary);
router.get('/on-duty-force',  protect, getOnDutyForce);
router.get('/on-duty-guards', protect, getOnDutyGuards);

module.exports = router;
