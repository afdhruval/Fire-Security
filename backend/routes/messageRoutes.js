const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { checkModuleAccess, checkPermission } = require('../middleware/rbac');
const { getAll, send } = require('../controllers/messageController');

// ✅ CEO and HR can access messages
router.use(protect, checkModuleAccess('messages'));

router
  .route('/')
  .get(checkPermission('view'), getAll)
  .post(
    checkPermission('create'),
    [
      body('senderName').notEmpty().withMessage('Sender name is required'),
      body('message').notEmpty().withMessage('Message is required'),
      validate,
    ],
    send
  );

module.exports = router;
