const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { checkModuleAccess, checkPermission } = require('../middleware/rbac');
const { getLogs, createLog, cleanup } = require('../controllers/auditLogController');

// ✅ CEO only — HR and Employee are blocked at module level
router.use(protect, checkModuleAccess('auditLogs'));

router.get('/',         checkPermission('view'),   getLogs);
router.post('/',        checkPermission('create'), createLog);
router.delete('/cleanup', checkPermission('delete'), cleanup);

module.exports = router;
