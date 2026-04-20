const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { checkModuleAccess, checkPermission } = require('../middleware/rbac');
const { getAll, create, update, remove } = require('../controllers/clientController');

// ✅ CEO and HR can access clients (Employee cannot)
router.use(protect, checkModuleAccess('clients'));

router
  .route('/')
  .get(checkPermission('view'), getAll)
  .post(
    checkPermission('create'),
    [
      body('clientName').notEmpty().withMessage('Client name is required'),
      body('companyName').notEmpty().withMessage('Company name is required'),
      body('contactPhone').notEmpty().withMessage('Contact phone is required'),
      validate,
    ],
    create
  );

router.route('/:id')
  .patch(checkPermission('edit'),   update)
  .delete(checkPermission('delete'), remove);

module.exports = router;
