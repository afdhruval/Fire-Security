const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { checkModuleAccess, checkPermission } = require('../middleware/rbac');
const {
  getContracts, getContract, createContract, updateContract, deleteContract
} = require('../controllers/contractController');

// ✅ CEO and HR can access contracts (Employee cannot)
router.use(protect, checkModuleAccess('contracts'));

router.get('/',      checkPermission('view'),   getContracts);
router.get('/:id',   checkPermission('view'),   getContract);
router.post('/',     checkPermission('create'), createContract);
router.put('/:id',   checkPermission('edit'),   updateContract);
router.delete('/:id',checkPermission('delete'), deleteContract);

module.exports = router;
