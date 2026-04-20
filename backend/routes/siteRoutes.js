const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { checkModuleAccess, checkPermission } = require('../middleware/rbac');
const { getAll, create, update, remove } = require('../controllers/siteController');

// ✅ CEO and HR can access sites (Employee cannot)
router.use(protect, checkModuleAccess('sites'));

router
  .route('/')
  .get(checkPermission('view'), getAll)
  .post(
    checkPermission('create'),
    [
      body('siteName').notEmpty().withMessage('Site name is required'),
      body('location').notEmpty().withMessage('Location is required'),
      body('client').notEmpty().withMessage('Client is required'),
      validate,
    ],
    create
  );

router.route('/:id')
  .patch(checkPermission('edit'),   update)
  .delete(checkPermission('delete'), remove);

module.exports = router;
