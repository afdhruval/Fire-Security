const Report = require('../models/Report');
const Alert = require('../models/Alert');

// ─────────────────────────────────────────────
// GET /api/v1/reports
// Supports: ?type=Fire&status=Pending&search=keyword
//           &from=2024-01-01&to=2024-12-31
//           &page=1&limit=10
// ─────────────────────────────────────────────
exports.getAll = async (req, res, next) => {
    try {
        const {
            type,
            status,
            severity,
            search,
            from,
            to,
            page = 1,
            limit = 10,
            sort = '-createdAt',
        } = req.query;

        const filter = {};

        if (type) filter.type = type;
        if (status) filter.status = status;
        if (severity) filter.severity = severity;

        // Date range filter on incidentDate
        if (from || to) {
            filter.incidentDate = {};
            if (from) filter.incidentDate.$gte = new Date(from);
            if (to) {
                const toDate = new Date(to);
                toDate.setHours(23, 59, 59, 999);
                filter.incidentDate.$lte = toDate;
            }
        }

        // Keyword search on title and description
        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { location: { $regex: search, $options: 'i' } },
            ];
        }

        const skip = (Number(page) - 1) * Number(limit);

        const [reports, total] = await Promise.all([
            Report.find(filter)
                .populate('createdBy', 'name email role')
                .populate('timeline.changedBy', 'name')
                .sort(sort)
                .skip(skip)
                .limit(Number(limit)),
            Report.countDocuments(filter),
        ]);

        res.status(200).json({
            success: true,
            total,
            page: Number(page),
            pages: Math.ceil(total / Number(limit)),
            reports,
        });
    } catch (err) {
        next(err);
    }
};

// ─────────────────────────────────────────────
// POST /api/v1/reports
// ─────────────────────────────────────────────
exports.create = async (req, res, next) => {
    try {
        const { title, type, description, location, severity, images, incidentDate } = req.body;

        const report = await Report.create({
            title,
            type,
            description,
            location,
            severity,
            images: images || [],
            incidentDate: incidentDate || new Date(),
            createdBy: req.user._id,
            // Seed initial timeline entry
            timeline: [
                {
                    status: 'Pending',
                    note: 'Report created',
                    changedBy: req.user._id,
                },
            ],
        });

        await report.populate('createdBy', 'name email role');

        // Auto-alert if it's an incident, fire, or security issue
        if (['Incident', 'Fire', 'Security'].includes(type) || ['High', 'Critical'].includes(severity)) {
            await Alert.create({
                type: type === 'Fire' ? 'fire' : 'incident',
                message: `New ${severity || ''} ${type} reported: ${title}`,
                userId: req.user._id,
                status: 'unread'
            });
        }

        res.status(201).json({ success: true, report });
    } catch (err) {
        next(err);
    }
};

// ─────────────────────────────────────────────
// GET /api/v1/reports/:id
// ─────────────────────────────────────────────
exports.getOne = async (req, res, next) => {
    try {
        const report = await Report.findById(req.params.id)
            .populate('createdBy', 'name email role')
            .populate('timeline.changedBy', 'name role');

        if (!report) {
            return res.status(404).json({ success: false, message: 'Report not found' });
        }

        res.status(200).json({ success: true, report });
    } catch (err) {
        next(err);
    }
};

// ─────────────────────────────────────────────
// PUT /api/v1/reports/:id
// Updates editable fields + appends status to timeline
// ─────────────────────────────────────────────
exports.update = async (req, res, next) => {
    try {
        const report = await Report.findById(req.params.id);
        if (!report) {
            return res.status(404).json({ success: false, message: 'Report not found' });
        }

        const { title, type, description, location, severity, status, images, incidentDate, note } = req.body;

        // Update editable fields
        if (title !== undefined) report.title = title;
        if (type !== undefined) report.type = type;
        if (description !== undefined) report.description = description;
        if (location !== undefined) report.location = location;
        if (severity !== undefined) report.severity = severity;
        if (images !== undefined) report.images = images;
        if (incidentDate !== undefined) report.incidentDate = incidentDate;

        // If status is changing, append a timeline entry
        if (status !== undefined && status !== report.status) {
            report.status = status;
            report.timeline.push({
                status,
                note: note || `Status updated to ${status}`,
                changedBy: req.user._id,
            });
        }

        await report.save();
        await report.populate('createdBy', 'name email role');
        await report.populate('timeline.changedBy', 'name role');

        res.status(200).json({ success: true, report });
    } catch (err) {
        next(err);
    }
};

// ─────────────────────────────────────────────
// DELETE /api/v1/reports/:id
// ─────────────────────────────────────────────
exports.remove = async (req, res, next) => {
    try {
        const report = await Report.findByIdAndDelete(req.params.id);
        if (!report) {
            return res.status(404).json({ success: false, message: 'Report not found' });
        }
        res.status(200).json({ success: true, message: 'Report deleted successfully' });
    } catch (err) {
        next(err);
    }
};

// ─────────────────────────────────────────────
// GET /api/v1/reports/analytics
// Returns counts by type and status for dashboard
// ─────────────────────────────────────────────
exports.analytics = async (req, res, next) => {
    try {
        const [byStatus, byType] = await Promise.all([
            Report.aggregate([
                { $group: { _id: '$status', count: { $sum: 1 } } },
            ]),
            Report.aggregate([
                { $group: { _id: '$type', count: { $sum: 1 } } },
            ]),
        ]);

        const total = await Report.countDocuments();

        // Convert arrays to easy-access objects
        const statusMap = byStatus.reduce((acc, cur) => {
            acc[cur._id] = cur.count;
            return acc;
        }, {});

        const typeMap = byType.reduce((acc, cur) => {
            acc[cur._id] = cur.count;
            return acc;
        }, {});

        res.status(200).json({
            success: true,
            analytics: {
                total,
                pending: statusMap['Pending'] || 0,
                inProgress: statusMap['In Progress'] || 0,
                completed: statusMap['Completed'] || 0,
                fire: typeMap['Fire'] || 0,
                security: typeMap['Security'] || 0,
                incident: typeMap['Incident'] || 0,
                daily: typeMap['Daily'] || 0,
                monthly: typeMap['Monthly'] || 0,
            },
        });
    } catch (err) {
        next(err);
    }
};
