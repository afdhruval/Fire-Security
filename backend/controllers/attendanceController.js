const Attendance = require('../models/Attendance');
const Alert      = require('../models/Alert');
const AuditLog   = require('../models/AuditLog');
const Guard      = require('../models/Guard');

// POST /api/v1/attendance
exports.mark = async (req, res, next) => {
    try {
        const { guard, site, date, status } = req.body;

        let record = await Attendance.findOne({ guard, date: new Date(date) });

        if (record) {
            record.status = status;
            await record.save();
        } else {
            record = await Attendance.create({ guard, site, date: new Date(date), status });
        }

        // ── Auto update guard status based on attendance ──────────────────
        const guardDoc = await Guard.findById(guard);
        if (guardDoc) {
            if (status === 'present') {
                // Mark active + record check-in time so scheduler knows when shift ends
                guardDoc.status      = 'active';
                guardDoc.lastCheckIn = new Date();
                await guardDoc.save();

                await Alert.create({
                    type:    'attendance',
                    message: `Guard ${guardDoc.name} checked in — now Active. Shift ends in ${guardDoc.shiftHours}h.`,
                    guardId: guard,
                    status:  'unread',
                });

            } else if (status === 'absent') {
                // Mark inactive immediately + clear check-in
                guardDoc.status      = 'inactive';
                guardDoc.lastCheckIn = null;
                await guardDoc.save();

                await Alert.create({
                    type:    'attendance',
                    message: `Attendance missed for guard ${guardDoc.name} on ${new Date(date).toDateString()}.`,
                    guardId: guard,
                    status:  'unread',
                });
            }
        }
        // ─────────────────────────────────────────────────────────────────

        await AuditLog.create({
            userId:   req.user?._id,
            userName: req.user?.name,
            action:   'MARK_ATTENDANCE',
            module:   'Attendance',
            details:  `Guard ${guardDoc?.name || guard} marked ${status}`,
        });

        res.status(200).json({ success: true, record });
    } catch (err) {
        next(err);
    }
};

// GET /api/v1/attendance?date=YYYY-MM-DD
exports.getByDate = async (req, res, next) => {
    try {
        const { date } = req.query;
        const filter = {};
        if (date) {
            const d    = new Date(date);
            const next = new Date(d);
            next.setDate(next.getDate() + 1);
            filter.date = { $gte: d, $lt: next };
        }
        const records = await Attendance.find(filter)
            .populate('guard', 'name phone shiftStartTime shiftHours lastCheckIn')
            .populate('site',  'siteName')
            .sort('guard');
        res.status(200).json({ success: true, records });
    } catch (err) {
        next(err);
    }
};

// GET /api/v1/attendance/guard/:guardId
exports.getByGuard = async (req, res, next) => {
    try {
        const records = await Attendance.find({ guard: req.params.guardId })
            .populate('site', 'siteName')
            .sort('-date');
        res.status(200).json({ success: true, records });
    } catch (err) {
        next(err);
    }
};