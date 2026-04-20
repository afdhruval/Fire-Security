const Guard = require('../models/Guard');
const Attendance = require('../models/Attendance');
const Report = require('../models/Report');
const Invoice = require('../models/Invoice');

// @desc  Get analytics summary
// @route GET /api/v1/analytics/summary
exports.getSummary = async (req, res) => {
  try {
    const totalGuards = await Guard.countDocuments();
    const activeGuards = await Guard.countDocuments({ status: 'active' });
    const inactiveGuards = await Guard.countDocuments({ status: 'inactive' });

    const totalAttendance = await Attendance.countDocuments();
    const presentCount = await Attendance.countDocuments({ status: 'present' });
    const attendanceRate = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0;

    const totalIncidents = await Report.countDocuments({ type: 'incident' });
    const openIncidents = await Report.countDocuments({ type: 'incident', status: { $in: ['pending', 'in-progress'] } });

    const totalInvoices = await Invoice.countDocuments();
    const paidInvoices = await Invoice.countDocuments({ status: 'paid' });
    const unpaidInvoices = await Invoice.countDocuments({ status: 'unpaid' });
    const invoiceAmounts = await Invoice.aggregate([
      { $group: { _id: '$status', total: { $sum: '$amount' } } }
    ]);

    res.json({
      success: true,
      data: {
        guards: { total: totalGuards, active: activeGuards, inactive: inactiveGuards },
        attendance: { total: totalAttendance, present: presentCount, rate: attendanceRate },
        incidents: { total: totalIncidents, open: openIncidents },
        invoices: { total: totalInvoices, paid: paidInvoices, unpaid: unpaidInvoices, amounts: invoiceAmounts }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Get incidents per month (last 6 months)
// @route GET /api/v1/analytics/incidents-per-month
exports.getIncidentsPerMonth = async (req, res) => {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const data = await Report.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const formatted = data.map(d => ({
      month: months[d._id.month - 1],
      year: d._id.year,
      count: d.count
    }));

    res.json({ success: true, data: formatted });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Get attendance trend (last 7 days)
// @route GET /api/v1/analytics/attendance-trend
exports.getAttendanceTrend = async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const data = await Attendance.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' },
            status: '$status'
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    // Restructure into [{date, present, absent}]
    const map = {};
    data.forEach(d => {
      const key = `${d._id.year}-${String(d._id.month).padStart(2, '0')}-${String(d._id.day).padStart(2, '0')}`;
      if (!map[key]) map[key] = { date: key, present: 0, absent: 0 };
      if (d._id.status === 'present') map[key].present = d.count;
      if (d._id.status === 'absent') map[key].absent = d.count;
    });

    res.json({ success: true, data: Object.values(map) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Get guard status breakdown
// @route GET /api/v1/analytics/guard-status
exports.getGuardStatus = async (req, res) => {
  try {
    const data = await Guard.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
