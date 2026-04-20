const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { checkModuleAccess, checkPermission } = require('../middleware/rbac');
const { getAll, create, markPaid, remove, update } = require('../controllers/invoiceController');

// ✅ CEO and HR can access billing (Employee cannot)
router.use(protect, checkModuleAccess('billing'));

router
  .route('/')
  .get(checkPermission('view'), getAll)
  .post(
    checkPermission('create'),
    [
      body('client').notEmpty().withMessage('Client ID is required'),
      body('amount').isNumeric().withMessage('Amount must be a number'),
      body('month').notEmpty().withMessage('Month is required'),
      validate,
    ],
    create
  );

router.patch('/:id/pay',  checkPermission('edit'),   markPaid);
router.put('/:id',        checkPermission('edit'),   update);
router.delete('/:id',     checkPermission('delete'), remove);

module.exports = router;
