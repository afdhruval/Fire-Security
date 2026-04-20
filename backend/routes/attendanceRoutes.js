const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { checkModuleAccess, checkPermission } = require('../middleware/rbac');
const { mark, getByDate, getByGuard } = require('../controllers/attendanceController');

// ✅ CEO, HR, Employee can access attendance
router.use(protect, checkModuleAccess('attendance'));

router
  .route('/')
  .get(checkPermission('view'), getByDate)
  .post(
    checkPermission('create'),
    [
      body('guard').notEmpty().withMessage('Guard ID is required'),
      body('site').notEmpty().withMessage('Site ID is required'),
      body('date').notEmpty().withMessage('Date is required'),
      body('status').isIn(['present', 'absent']).withMessage('Status must be present or absent'),
      validate,
    ],
    mark
  );

router.get('/guard/:guardId', checkPermission('view'), getByGuard);

module.exports = router;
