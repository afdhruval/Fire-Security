const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { checkModuleAccess, checkPermission } = require('../middleware/rbac');
const { getAll, create, update, remove, toggleStatus } = require('../controllers/guardController');

// ✅ CEO and HR can access guards module (Employee cannot — guards are part of onDutyForce for employees)
router.use(protect, checkModuleAccess('guards'));

router.get('/',              checkPermission('view'),   getAll);
router.post('/',             checkPermission('create'), create);
router.put('/:id',           checkPermission('edit'),   update);
router.delete('/:id',        checkPermission('delete'), remove);
router.patch('/:id/status',  checkPermission('edit'),   toggleStatus);

module.exports = router;
