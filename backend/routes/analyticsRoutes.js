const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { checkModuleAccess, checkPermission } = require('../middleware/rbac');
const {
  getSummary, getIncidentsPerMonth, getAttendanceTrend, getGuardStatus
} = require('../controllers/analyticsController');

// ✅ CEO only — HR and Employee are blocked at module level
router.use(protect, checkModuleAccess('analytics'));

router.get('/summary',             checkPermission('view'), getSummary);
router.get('/incidents-per-month', checkPermission('view'), getIncidentsPerMonth);
router.get('/attendance-trend',    checkPermission('view'), getAttendanceTrend);
router.get('/guard-status',        checkPermission('view'), getGuardStatus);

module.exports = router;
