const Alert = require('../models/Alert');

// @desc   Get all alerts (most recent first)
// @route  GET /api/v1/alerts
// @access Private
exports.getAlerts = async (req, res) => {
  try {
    const alerts = await Alert.find()
      .populate('userId', 'name email')
      .populate('guardId', 'name phone')
      .sort({ createdAt: -1 })
      .limit(100);
    res.json({ success: true, count: alerts.length, data: alerts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc   Get unread alert count
// @route  GET /api/v1/alerts/unread-count
// @access Private
exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Alert.countDocuments({ status: 'unread' });
    res.json({ success: true, count });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc   Create alert
// @route  POST /api/v1/alerts
// @access Private
exports.createAlert = async (req, res) => {
  try {
    const alert = await Alert.create(req.body);
    res.status(201).json({ success: true, data: alert });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc   Mark alert as read
// @route  PATCH /api/v1/alerts/:id/read
// @access Private
exports.markRead = async (req, res) => {
  try {
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      { status: 'read' },
      { new: true }
    );
    if (!alert) return res.status(404).json({ success: false, message: 'Alert not found' });
    res.json({ success: true, data: alert });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc   Mark all alerts as read
// @route  PATCH /api/v1/alerts/read-all
// @access Private
exports.markAllRead = async (req, res) => {
  try {
    await Alert.updateMany({ status: 'unread' }, { status: 'read' });
    res.json({ success: true, message: 'All alerts marked as read' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc   Delete alert
// @route  DELETE /api/v1/alerts/:id
// @access Private
exports.deleteAlert = async (req, res) => {
  try {
    const alert = await Alert.findByIdAndDelete(req.params.id);
    if (!alert) return res.status(404).json({ success: false, message: 'Alert not found' });
    res.json({ success: true, message: 'Alert deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
