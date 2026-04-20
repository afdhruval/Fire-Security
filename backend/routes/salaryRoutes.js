const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { checkModuleAccess, checkPermission } = require('../middleware/rbac');
const { getAll, create, update, remove, markPaid } = require('../controllers/salaryController');

// ✅ Fixed: was 'billing' — now correctly uses 'salary' module
router.use(protect, checkModuleAccess('salary'));

router
  .route('/')
  .get(checkPermission('view'), getAll)
  .post(
    checkPermission('create'),
    [
      body('guard').notEmpty().withMessage('Guard ID is required'),
      body('month').notEmpty().withMessage('Month is required'),
      body('totalDaysPresent').isNumeric().withMessage('Total days present must be a number'),
      body('totalSalary').isNumeric().withMessage('Total salary must be a number'),
      validate,
    ],
    create
  );

router.route('/:id')
  .patch(checkPermission('edit'),   update)
  .delete(checkPermission('delete'), remove);

router.patch('/:id/pay', checkPermission('edit'), markPaid);

module.exports = router;