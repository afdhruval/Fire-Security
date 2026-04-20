const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
    getAll,
    create,
    getOne,
    update,
    remove,
    analytics,
} = require('../controllers/reportController');

// All report routes require authentication
router.use(protect);

// Analytics (must be declared before /:id to avoid route conflict)
router.get('/analytics', analytics);

// CRUD routes
router.route('/')
    .get(getAll)
    .post(create);

router.route('/:id')
    .get(getOne)
    .put(update)
    .delete(authorize('Admin', 'HR'), remove);

module.exports = router;
