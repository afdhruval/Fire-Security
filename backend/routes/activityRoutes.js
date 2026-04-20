const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth');
const { checkModuleAccess, checkPermission } = require('../middleware/rbac');
const {
  getActivities,
  createActivity,
  deleteActivity,
  updateActivity,
  snoozeActivity,
} = require('../controllers/activityController');

// ✅ All roles can access activities module
router.use(protect, checkModuleAccess('activities'));

router.get('/',            checkPermission('view'),   getActivities);
router.post('/',           checkPermission('create'), createActivity);
router.put('/:id',         checkPermission('edit'),   updateActivity);
router.delete('/:id',      checkPermission('delete'), deleteActivity);
router.post('/:id/snooze', checkPermission('edit'),   snoozeActivity);

module.exports = router;
