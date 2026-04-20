const Guard = require('../models/Guard');
const Site = require('../models/Site');
const Alert = require('../models/Alert');
const AuditLog = require('../models/AuditLog');

exports.getAll = async (req, res, next) => {
  try {
    const rawGuards = await Guard.find()
      .populate('assignedSite', 'siteName location')
      .sort('-createdAt')
      .lean(); // plain JS objects — safe to mutate

    // ── On-Duty Force card bug fix ────────────────────────────────────────
    // Ensure every guard has valid numeric/string values so the frontend
    // card never receives null/undefined and renders blank or black.
    const guards = rawGuards.map((g) => ({
      ...g,
      salary:      typeof g.salary      === 'number' ? g.salary      : 0,
      shiftHours:  typeof g.shiftHours  === 'number' ? g.shiftHours  : 0,
      name:        g.name               || 'Unknown Guard',
      phone:       g.phone              || '',
      status:      g.status             || 'inactive',
      shiftStartTime: g.shiftStartTime  || '09:00',
      location: {
        latitude:  typeof g.location?.latitude  === 'number' ? g.location.latitude  : 0,
        longitude: typeof g.location?.longitude === 'number' ? g.location.longitude : 0,
      },
      reactivateAt: g.reactivateAt || null,
      lastCheckIn:  g.lastCheckIn  || null,
    }));

    res.status(200).json({ success: true, guards });
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const guard = await Guard.create(req.body);

    // Add guard to site's guards array
    if (guard.assignedSite) {
      await Site.findByIdAndUpdate(guard.assignedSite, { $addToSet: { guards: guard._id } });
    }

    res.status(201).json({ success: true, guard });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const oldGuard = await Guard.findById(req.params.id);
    const guard = await Guard.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!guard) return res.status(404).json({ success: false, message: 'Guard not found' });

    // Update site references if assignedSite changed
    if (oldGuard && String(oldGuard.assignedSite) !== String(guard.assignedSite)) {
      if (oldGuard.assignedSite) await Site.findByIdAndUpdate(oldGuard.assignedSite, { $pull: { guards: guard._id } });
      if (guard.assignedSite) await Site.findByIdAndUpdate(guard.assignedSite, { $addToSet: { guards: guard._id } });
    }

    // Auto-alert if guard goes offline/inactive
    if (oldGuard && oldGuard.status === 'active' && guard.status === 'inactive') {
      await Alert.create({
        type: 'guard',
        message: `Guard ${guard.name} has been marked offline/inactive.`,
        guardId: guard._id,
        status: 'unread',
      });
    }

    // Audit
    await AuditLog.create({
      userId: req.user?._id,
      userName: req.user?.name,
      action: 'UPDATE',
      module: 'Guards',
      details: `Updated guard: ${guard.name}`,
    });

    res.status(200).json({ success: true, guard });
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const guard = await Guard.findByIdAndDelete(req.params.id);
    if (!guard) return res.status(404).json({ success: false, message: 'Guard not found' });
    if (guard.assignedSite) await Site.findByIdAndUpdate(guard.assignedSite, { $pull: { guards: guard._id } });
    res.status(200).json({ success: true, message: 'Guard deleted' });
  } catch (err) {
    next(err);
  }
};

// ─── PATCH /api/v1/guards/:id/status ─────────────────────────────────────────
// Body: { status: 'active' | 'inactive', reactivateAt?: ISO date string | null }
// - Manual toggle (both directions)
// - Optional reactivateAt: when setting inactive, admin can schedule auto-reactivation
// - Setting to active always clears reactivateAt
exports.toggleStatus = async (req, res, next) => {
  try {
    const { status, reactivateAt } = req.body;

    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be active or inactive' });
    }

    const guard = await Guard.findById(req.params.id);
    if (!guard) return res.status(404).json({ success: false, message: 'Guard not found' });

    const oldStatus = guard.status;

    guard.status = status;

    // If activating — always clear the scheduled date
    if (status === 'active') {
      guard.reactivateAt = null;
    }

    // If inactivating — save optional scheduled reactivation date
    if (status === 'inactive') {
      guard.reactivateAt = reactivateAt ? new Date(reactivateAt) : null;
    }

    await guard.save();

    // ── Alert: guard went inactive ────────────────────────────────────────
    if (oldStatus === 'active' && status === 'inactive') {
      const scheduleMsg = guard.reactivateAt
        ? ` Scheduled to reactivate on ${new Date(guard.reactivateAt).toLocaleString('en-IN')}.`
        : '';
      await Alert.create({
        type: 'guard',
        message: `Guard ${guard.name} has been manually set to inactive.${scheduleMsg}`,
        guardId: guard._id,
        status: 'unread',
      });
    }

    // ── Alert: guard reactivated ──────────────────────────────────────────
    if (oldStatus === 'inactive' && status === 'active') {
      await Alert.create({
        type: 'guard',
        message: `Guard ${guard.name} has been manually reactivated.`,
        guardId: guard._id,
        status: 'unread',
      });
    }

    // ── Audit log ─────────────────────────────────────────────────────────
    await AuditLog.create({
      userId: req.user?._id,
      userName: req.user?.name,
      action: 'UPDATE',
      module: 'Guards',
      details: `Status changed for guard ${guard.name}: ${oldStatus} → ${status}${guard.reactivateAt ? ` (reactivate at ${guard.reactivateAt.toISOString()})` : ''}`,
    });

    // ── Socket emit ───────────────────────────────────────────────────────
    const io = req.app.get('io');
    if (io) io.emit('guardStatusChanged', { guardId: guard._id, status, reactivateAt: guard.reactivateAt });

    // Populate site before returning
    await guard.populate('assignedSite', 'siteName location');

    res.status(200).json({ success: true, guard });
  } catch (err) {
    next(err);
  }
};