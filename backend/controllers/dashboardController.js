/**
 * Dashboard Controller — FireSentrix
 * Provides safe, role-aware summary data for the dashboard.
 *
 * Key fix: ON-DUTY FORCE count is served from a dedicated endpoint
 * accessible to ALL roles (including Employee), so the first card
 * never shows blank/black regardless of role.
 */

const Guard      = require('../models/Guard');
const Attendance = require('../models/Attendance');
const Equipment  = require('../models/Equipment');
const Invoice    = require('../models/Invoice');
const Activity   = require('../models/Activity');

/**
 * GET /api/v1/dashboard/summary
 * Returns summary stats for all roles.
 * - onDutyForce : always a number (0 if no data)
 * - todayAttendance : present/absent counts
 * - equipment : total count
 * - billing : total invoice amount (CEO + HR only; 0 for Employee)
 */
exports.getSummary = async (req, res) => {
  try {
    const role = req.user?.role;

    // ── ON-DUTY FORCE (all roles) ──────────────────────────────────────────
    const onDutyForce = await Guard.countDocuments({ status: 'active' }).catch(() => 0);

    // ── TODAY ATTENDANCE (all roles) ──────────────────────────────────────
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [presentCount, absentCount] = await Promise.all([
      Attendance.countDocuments({ date: { $gte: today, $lt: tomorrow }, status: 'present' }).catch(() => 0),
      Attendance.countDocuments({ date: { $gte: today, $lt: tomorrow }, status: 'absent' }).catch(() => 0),
    ]);

    // ── EQUIPMENT COUNT (all roles) ──────────────────────────────────────
    const equipmentCount = await Equipment.countDocuments().catch(() => 0);

    // ── BILLING (CEO + HR only; Employee gets 0) ──────────────────────────
    let billingTotal = 0;
    if (role === 'Admin' || role === 'HR') {
      const result = await Invoice.aggregate([
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]).catch(() => []);
      billingTotal = result[0]?.total || 0;
    }

    // ── ACTIVITIES (all roles) ────────────────────────────────────────────
    const [todayAct, upcomingAct, completedAct] = await Promise.all([
      Activity.countDocuments({ status: 'today' }).catch(() => 0),
      Activity.countDocuments({ status: 'upcoming' }).catch(() => 0),
      Activity.countDocuments({ status: 'completed' }).catch(() => 0),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        onDutyForce:      typeof onDutyForce === 'number' ? onDutyForce : 0,
        todayAttendance: {
          present: presentCount,
          absent:  absentCount,
        },
        equipment:   equipmentCount,
        billing:     billingTotal,
        activities: {
          today:     todayAct,
          upcoming:  upcomingAct,
          completed: completedAct,
        },
      },
    });
  } catch (err) {
    // Always return a valid shape — never null/undefined
    return res.status(200).json({
      success: true,
      data: {
        onDutyForce:     0,
        todayAttendance: { present: 0, absent: 0 },
        equipment:       0,
        billing:         0,
        activities:      { today: 0, upcoming: 0, completed: 0 },
      },
      _error: err.message,
    });
  }
};

/**
 * GET /api/v1/dashboard/on-duty-force
 * Dedicated lightweight endpoint — returns ONLY the on-duty count.
 * Accessible by ALL roles (Employee included).
 * Guaranteed to always return { onDutyForce: <number> }.
 */
exports.getOnDutyForce = async (req, res) => {
  try {
    const count = await Guard.countDocuments({ status: 'active' });
    return res.status(200).json({
      success:     true,
      onDutyForce: typeof count === 'number' ? count : 0,
    });
  } catch (err) {
    // Never return null — always return 0 on error
    return res.status(200).json({
      success:     true,
      onDutyForce: 0,
      _error:      err.message,
    });
  }
};

/**
 * GET /api/v1/dashboard/on-duty-guards
 * Returns the list of active guards (name + assigned site).
 * Accessible by ALL roles — used by the On Duty modal in the dashboard.
 * Always returns { guards: [] } — never null.
 */
exports.getOnDutyGuards = async (req, res) => {
  try {
    const guards = await Guard.find({ status: 'active' })
      .populate('assignedSite', 'siteName')
      .select('name assignedSite status dutyStatus locationLabel')
      .lean();

    const list = (guards || []).map(g => {
      // Prioritize the Live Tracker's locationLabel and dutyStatus, fallback to assignedSite
      const loc = g.locationLabel || g.assignedSite?.siteName || 'Unassigned';
      const duty = g.dutyStatus || 'On Duty';

      return {
        name: g.name,
        site: `${loc} (${duty})`,
      };
    });

    return res.status(200).json({ success: true, guards: list });
  } catch (err) {
    return res.status(200).json({ success: true, guards: [], _error: err.message });
  }
};
