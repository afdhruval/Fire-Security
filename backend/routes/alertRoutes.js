const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { checkModuleAccess, checkPermission } = require('../middleware/rbac');
const {
  getAlerts, getUnreadCount, createAlert, markRead, markAllRead, deleteAlert
} = require('../controllers/alertController');

// ✅ CEO and HR can access alerts
router.use(protect, checkModuleAccess('alerts'));

router.get('/',             checkPermission('view'),   getAlerts);
router.get('/unread-count', checkPermission('view'),   getUnreadCount);
router.post('/',            checkPermission('create'), createAlert);
router.patch('/read-all',   checkPermission('edit'),   markAllRead);
router.patch('/:id/read',   checkPermission('edit'),   markRead);
router.delete('/:id',       checkPermission('delete'), deleteAlert);

module.exports = router;
