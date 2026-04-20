const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { checkModuleAccess, checkPermission } = require('../middleware/rbac');
const {
  getRoutes, getRoute, createRoute, updateRoute, deleteRoute,
  startPatrol, scanCheckpoint, getLogs, getLog
} = require('../controllers/patrolController');

// ✅ Fixed: Admin + Employee can access guardPatrol (HR excluded — not operational role)
router.use(protect, checkModuleAccess('guardPatrol'));

// Patrol Routes
router.get('/routes',              checkPermission('view'),   getRoutes);
router.get('/routes/:id',          checkPermission('view'),   getRoute);
router.post('/routes',             checkPermission('create'), createRoute);
router.put('/routes/:id',          checkPermission('edit'),   updateRoute);
router.delete('/routes/:id',       checkPermission('delete'), deleteRoute);

// Patrol Logs
router.get('/logs',                checkPermission('view'),   getLogs);
router.get('/logs/:id',            checkPermission('view'),   getLog);
router.post('/logs/start',         checkPermission('create'), startPatrol);
router.post('/logs/:logId/scan',   checkPermission('create'), scanCheckpoint);

module.exports = router;