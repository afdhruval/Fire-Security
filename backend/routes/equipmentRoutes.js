const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { checkModuleAccess, checkPermission } = require('../middleware/rbac');
const { getAll, create, update, remove } = require('../controllers/equipmentController');

// ✅ CEO, HR, Employee can access equipment
router.use(protect, checkModuleAccess('equipment'));

router
  .route('/')
  .get(checkPermission('view'), getAll)
  .post(
    checkPermission('create'),
    [
      body('equipmentName').notEmpty().withMessage('Equipment name is required'),
      body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
      body('type').notEmpty().isIn(['Extinguisher', 'Alarm', 'CCTV', 'Hydrant']).withMessage('Type is required and must be valid'),
      body('site').notEmpty().isMongoId().withMessage('Site is required and must be a valid ID'),
      validate,
    ],
    create
  );

router
  .route('/:id')
  .patch(checkPermission('edit'),   update)
  .delete(checkPermission('delete'), remove);

module.exports = router;
