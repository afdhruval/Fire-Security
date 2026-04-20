const PatrolRoute = require('../models/PatrolRoute');
const PatrolLog = require('../models/PatrolLog');
const Alert = require('../models/Alert');

// ─── PATROL ROUTES ───────────────────────────────────────────────

// @desc  Get all patrol routes
// @route GET /api/v1/patrol/routes
exports.getRoutes = async (req, res) => {
  try {
    const routes = await PatrolRoute.find()
      .populate('assignedGuard', 'name phone status')
      .populate('site', 'name address')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: routes.length, data: routes });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Get single patrol route
// @route GET /api/v1/patrol/routes/:id
exports.getRoute = async (req, res) => {
  try {
    const route = await PatrolRoute.findById(req.params.id)
      .populate('assignedGuard', 'name phone status')
      .populate('site', 'name address');
    if (!route) return res.status(404).json({ success: false, message: 'Route not found' });
    res.json({ success: true, data: route });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Create patrol route
// @route POST /api/v1/patrol/routes
exports.createRoute = async (req, res) => {
  try {
    const route = await PatrolRoute.create(req.body);
    res.status(201).json({ success: true, data: route });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc  Update patrol route
// @route PUT /api/v1/patrol/routes/:id
exports.updateRoute = async (req, res) => {
  try {
    const route = await PatrolRoute.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!route) return res.status(404).json({ success: false, message: 'Route not found' });
    res.json({ success: true, data: route });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc  Delete patrol route
// @route DELETE /api/v1/patrol/routes/:id
exports.deleteRoute = async (req, res) => {
  try {
    const route = await PatrolRoute.findByIdAndDelete(req.params.id);
    if (!route) return res.status(404).json({ success: false, message: 'Route not found' });
    res.json({ success: true, message: 'Route deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── PATROL LOGS ─────────────────────────────────────────────────

// @desc  Start patrol (create log)
// @route POST /api/v1/patrol/logs/start
exports.startPatrol = async (req, res) => {
  try {
    const { routeId, guardId } = req.body;
    const route = await PatrolRoute.findById(routeId);
    if (!route) return res.status(404).json({ success: false, message: 'Route not found' });

    const checkpointLogs = route.checkpoints.map(cp => ({
      checkpointId: cp._id,
      name: cp.name,
      qrValue: cp.qrValue,
      status: 'missed',
      scannedAt: null
    }));

    const logData = {
      route: routeId,
      checkpoints: checkpointLogs,
      status: 'in-progress'
    };
    
    // Only attach guard if it is a valid string
    if (guardId && guardId.trim() !== '') {
        logData.guard = guardId;
    }

    const log = await PatrolLog.create(logData);

    res.status(201).json({ success: true, data: log });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc  Scan QR checkpoint
// @route POST /api/v1/patrol/logs/:logId/scan
exports.scanCheckpoint = async (req, res) => {
  try {
    const { qrValue } = req.body;
    if (!qrValue) return res.status(400).json({ success: false, message: 'QR value is required' });

    const log = await PatrolLog.findById(req.params.logId);
    if (!log) return res.status(404).json({ success: false, message: 'Patrol log not found' });

    const checkpoint = log.checkpoints.find(cp => 
      cp.qrValue.toString().toLowerCase() === qrValue.toString().toLowerCase()
    );
    if (!checkpoint) return res.status(400).json({ success: false, message: 'Invalid QR code. Checkpoint not found in this route.' });

    // Allow re-scanning or skip if already completed
    if (checkpoint.status !== 'completed') {
        checkpoint.status = 'completed';
        checkpoint.scannedAt = new Date();
    }

    // Check if all done
    const allDone = log.checkpoints.every(cp => cp.status === 'completed');
    if (allDone) log.status = 'completed';

    await log.save();
    
    // Repopulate for the frontend so it sees it correctly
    await log.populate('route', 'name');
    if (log.guard) await log.populate('guard', 'name phone');

    res.json({ success: true, data: log });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc  Get patrol logs
// @route GET /api/v1/patrol/logs
exports.getLogs = async (req, res) => {
  try {
    const filter = {};
    if (req.query.guardId) filter.guard = req.query.guardId;
    if (req.query.routeId) filter.route = req.query.routeId;

    const logs = await PatrolLog.find(filter)
      .populate('route', 'name')
      .populate('guard', 'name phone')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: logs.length, data: logs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Get single patrol log
// @route GET /api/v1/patrol/logs/:id
exports.getLog = async (req, res) => {
  try {
    const log = await PatrolLog.findById(req.params.id)
      .populate('route', 'name checkpoints')
      .populate('guard', 'name phone');
    if (!log) return res.status(404).json({ success: false, message: 'Log not found' });
    res.json({ success: true, data: log });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
