const Guard = require('../models/Guard');

/**
 * POST /api/v1/location/update
 * Body: { guardId, latitude, longitude }
 * guardId = the logged-in auth user's _id (from JWT / AuthContext)
 */
exports.updateLocation = async (req, res) => {
  try {
    const { guardId, latitude, longitude } = req.body;

    if (!guardId || latitude == null || longitude == null) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: guardId, latitude, longitude',
      });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({
        success: false,
        message: 'latitude and longitude must be valid numbers',
      });
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coordinate range',
      });
    }

    const updatePayload = {
      'location.latitude':  lat,
      'location.longitude': lng,
      'location.updatedAt': new Date(),
      lastSeen: new Date(),
    };

    // ── Step 1: Try direct Guard._id match ────────────────────────────────
    let guard = await Guard.findByIdAndUpdate(
      guardId,
      updatePayload,
      { new: true, runValidators: false }
    ).select('name phone status location assignedSite');

    // ── Step 2: Fallback — match by linked userId (auth user's _id) ───────
    if (!guard) {
      guard = await Guard.findOneAndUpdate(
        { userId: guardId },
        updatePayload,
        { new: true, runValidators: false }
      ).select('name phone status location assignedSite');
    }

    // ── Step 3: Still not found — return clear error ───────────────────────
    if (!guard) {
      return res.status(404).json({
        success: false,
        message: `Guard not found. The auth user ID (${guardId}) is not linked to any Guard record. Ask your admin to link your account.`,
      });
    }

    // ── Socket emit ────────────────────────────────────────────────────────
    const io = req.app.get('io');
    if (io) {
      io.emit('guardLocationUpdated', {
        guardId:   guard._id,
        name:      guard.name,
        status:    guard.status,
        latitude:  lat,
        longitude: lng,
        updatedAt: new Date().toISOString(),
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Location updated successfully',
      guard: {
        _id:      guard._id,
        name:     guard.name,
        status:   guard.status,
        location: guard.location,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PATCH /api/v1/location/:id
 * Body: { latitude, longitude }
 */
exports.updateLocationById = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    if (latitude == null || longitude == null) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: latitude, longitude',
      });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ success: false, message: 'latitude and longitude must be valid numbers' });
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({ success: false, message: 'Invalid coordinate range' });
    }

    const guard = await Guard.findByIdAndUpdate(
      req.params.id,
      {
        'location.latitude':  lat,
        'location.longitude': lng,
        'location.updatedAt': new Date(),
        lastSeen: new Date(),
      },
      { new: true, runValidators: false }
    ).select('name phone status location assignedSite');

    if (!guard) {
      return res.status(404).json({ success: false, message: 'Guard not found' });
    }

    const io = req.app.get('io');
    if (io) {
      io.emit('guardLocationUpdated', {
        guardId:   guard._id,
        name:      guard.name,
        status:    guard.status,
        latitude:  lat,
        longitude: lng,
        updatedAt: new Date().toISOString(),
      });
    }

    return res.status(200).json({
      success: true,
      guard: {
        _id:      guard._id,
        name:     guard.name,
        status:   guard.status,
        location: guard.location,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/v1/guard/location/:id
 */
exports.getLocationById = async (req, res) => {
  try {
    const guard = await Guard.findById(req.params.id)
      .select('name phone status location assignedSite')
      .populate('assignedSite', 'siteName location');

    if (!guard) {
      return res.status(404).json({ success: false, message: 'Guard not found' });
    }

    return res.status(200).json({
      success: true,
      guard: {
        _id:    guard._id,
        name:   guard.name   || 'Unknown',
        phone:  guard.phone  || '',
        status: guard.status || 'inactive',
        assignedSite: guard.assignedSite || null,
        location: {
          latitude:  typeof guard.location?.latitude  === 'number' ? guard.location.latitude  : 0,
          longitude: typeof guard.location?.longitude === 'number' ? guard.location.longitude : 0,
        },
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/v1/location
 */
exports.getLocations = async (req, res) => {
  try {
    const guards = await Guard.find({ 'location.latitude': { $ne: null } })
      .select('name phone status dutyStatus locationLabel location assignedSite')
      .populate('assignedSite', 'siteName location');

    const sanitised = guards.map((g) => ({
      _id:    g._id,
      name:   g.name   || 'Unknown',
      phone:  g.phone  || '',
      status: g.status || 'inactive',
      dutyStatus:    g.dutyStatus    || 'Off Duty',
      locationLabel: g.locationLabel || '',
      assignedSite: g.assignedSite || null,
      location: {
        latitude:  typeof g.location?.latitude  === 'number' ? g.location.latitude  : 0,
        longitude: typeof g.location?.longitude === 'number' ? g.location.longitude : 0,
      },
    }));

    return res.status(200).json({ success: true, guards: sanitised });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/v1/location/all-guards
 * Returns ALL guards (with or without location) for the Admin Live Tracker view.
 * Includes dutyStatus and locationLabel.
 */
exports.getAllGuardsForTracker = async (req, res) => {
  try {
    const guards = await Guard.find()
      .select('name phone status dutyStatus locationLabel location assignedSite lastSeen')
      .populate('assignedSite', 'siteName')
      .lean();

    const sanitised = guards.map((g) => ({
      _id:    g._id,
      name:   g.name   || 'Unknown',
      phone:  g.phone  || '',
      status: g.status || 'inactive',
      dutyStatus:    g.dutyStatus    || 'Off Duty',
      locationLabel: g.locationLabel || '',
      assignedSite:  g.assignedSite  || null,
      lastSeen:      g.lastSeen      || null,
      location: {
        latitude:  typeof g.location?.latitude  === 'number' ? g.location.latitude  : null,
        longitude: typeof g.location?.longitude === 'number' ? g.location.longitude : null,
      },
    }));

    return res.status(200).json({ success: true, guards: sanitised });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PATCH /api/v1/location/:id/assign
 * Body: { locationLabel: string, latitude: number, longitude: number, dutyStatus: string }
 * Admin/HR assigns a preset Gujarat location + duty status to a guard.
 */
exports.assignGuardLocation = async (req, res) => {
  try {
    const { locationLabel, latitude, longitude, dutyStatus } = req.body;

    const updatePayload = {};
    if (locationLabel !== undefined) updatePayload.locationLabel = locationLabel;
    if (dutyStatus    !== undefined) updatePayload.dutyStatus    = dutyStatus;

    if (latitude != null && longitude != null) {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        updatePayload['location.latitude']  = lat;
        updatePayload['location.longitude'] = lng;
        updatePayload['location.updatedAt'] = new Date();
        updatePayload.lastSeen = new Date();
      }
    }

    const guard = await Guard.findByIdAndUpdate(
      req.params.id,
      updatePayload,
      { new: true, runValidators: false }
    ).select('name phone status dutyStatus locationLabel location assignedSite');

    if (!guard) {
      return res.status(404).json({ success: false, message: 'Guard not found' });
    }

    // Emit socket event so map updates in real-time
    const io = req.app.get('io');
    if (io) {
      io.emit('guardLocationUpdated', {
        guardId:       guard._id,
        name:          guard.name,
        status:        guard.status,
        dutyStatus:    guard.dutyStatus,
        locationLabel: guard.locationLabel,
        latitude:      guard.location?.latitude,
        longitude:     guard.location?.longitude,
        updatedAt:     new Date().toISOString(),
      });
    }

    return res.status(200).json({ success: true, guard });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};