const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth');
const {
  updateLocation,
  updateLocationById,
  getLocations,
  getLocationById,
  getAllGuardsForTracker,
  assignGuardLocation,
} = require('../controllers/locationController');

// ── Spec routes (mounted at /api/v1/guard) ───────────────────────────────────
router.post('/location',        protect, updateLocation);     // POST  /api/v1/guard/location
router.get('/location',         protect, getLocations);       // GET   /api/v1/guard/location
router.get('/location/:id',     protect, getLocationById);    // GET   /api/v1/guard/location/:id

// ── Legacy aliases (mounted at /api/v1/location) ─────────────────────────────
router.post('/update',          protect, updateLocation);          // POST  /api/v1/location/update
router.get('/all-guards',       protect, getAllGuardsForTracker);  // GET   /api/v1/location/all-guards (Admin tracker)
router.get('/',                 protect, getLocations);            // GET   /api/v1/location
router.get('/:id',              protect, getLocationById);         // GET   /api/v1/location/:id

// ── PATCH routes ─────────────────────────────────────────────────────────────
router.patch('/:id/assign',     protect, assignGuardLocation);    // PATCH /api/v1/location/:id/assign
router.patch('/:id',            protect, updateLocationById);     // PATCH /api/v1/location/:id

module.exports = router;