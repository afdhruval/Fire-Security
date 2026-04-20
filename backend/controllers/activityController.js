const Activity = require('../models/Activity');
const Alert    = require('../models/Alert');

// ✅ GET ALL ACTIVITIES
exports.getActivities = async (req, res) => {
  try {
    const activities = await Activity.find().sort({ createdAt: -1 }).lean();

    const normalized = activities.map(a => ({
      ...a,
      addedBy: {
        name:   a.addedBy?.name   || 'Admin',
        role:   a.addedBy?.role   || 'admin',
        userId: a.addedBy?.userId || null,
      }
    }));

    res.json({ success: true, activities: normalized });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ CREATE ACTIVITY — alert on creation
exports.createActivity = async (req, res) => {
  try {
    const { title, description, time, location, priority, assignedGuard, status } = req.body;

    if (!title || !time) {
      return res.status(400).json({ success: false, message: 'Title and time are required' });
    }

    const activity = await Activity.create({
      title,
      description:    description   || '',
      time,
      location:       location      || '',
      priority:       priority      || 'medium',
      assignedGuard:  assignedGuard || { name: '', guardId: null },
      status:         status        || 'today',
      completionNote: '',
      addedBy: {
        name:   req.user?.name || 'Admin',
        role:   req.user?.role || 'admin',
        userId: req.user?._id  || null,
      }
    });

    // ── Alert: new activity created ───────────────────────────────────────
    const activityTime = new Date(time).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true
    });
    await Alert.create({
      type:    'system',
      message: `📋 New activity added: "${title}" scheduled for ${activityTime}${assignedGuard?.name ? ` — assigned to ${assignedGuard.name}` : ''}.`,
      status:  'unread',
    });

    const io = req.app.get('io');
    if (io) io.emit('activityCreated', activity);

    res.status(201).json({ success: true, activity });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ UPDATE ACTIVITY — alert on completion
exports.updateActivity = async (req, res) => {
  try {
    const { title, description, time, location, priority, assignedGuard, status, completionNote } = req.body;

    // Grab old status before update to detect completion
    const oldActivity = await Activity.findById(req.params.id);

    const activity = await Activity.findByIdAndUpdate(
      req.params.id,
      {
        ...(title          !== undefined && { title }),
        ...(description    !== undefined && { description }),
        ...(time           !== undefined && { time }),
        ...(location       !== undefined && { location }),
        ...(priority       !== undefined && { priority }),
        ...(assignedGuard  !== undefined && { assignedGuard }),
        ...(status         !== undefined && { status }),
        ...(completionNote !== undefined && { completionNote }),
      },
      { new: true, runValidators: true }
    );

    if (!activity) {
      return res.status(404).json({ success: false, message: 'Activity not found' });
    }

    // ── Alert: activity marked completed ─────────────────────────────────
    if (oldActivity?.status !== 'completed' && status === 'completed') {
      await Alert.create({
        type:    'system',
        message: `✅ Activity "${activity.title}" has been marked as completed${completionNote ? `: "${completionNote}"` : '.'}`,
        status:  'unread',
      });
    }

    const io = req.app.get('io');
    if (io) io.emit('activityUpdated', activity);

    res.json({ success: true, activity });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ DELETE ACTIVITY
exports.deleteActivity = async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id);

    if (!activity) {
      return res.status(404).json({ success: false, message: 'Activity not found' });
    }

    await activity.deleteOne();

    const io = req.app.get('io');
    if (io) io.emit('activityDeleted', req.params.id);

    res.json({ success: true, message: 'Activity deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ SNOOZE / REMIND LATER — POST /api/v1/activities/:id/snooze
exports.snoozeActivity = async (req, res) => {
  try {
    const { minutes = 15 } = req.body;
    const activity = await Activity.findById(req.params.id);

    if (!activity) {
      return res.status(404).json({ success: false, message: 'Activity not found' });
    }

    const snoozedTime = new Date(new Date(activity.time).getTime() + minutes * 60 * 1000);
    activity.time     = snoozedTime.toISOString();
    await activity.save();

    await Alert.create({
      type:    'system',
      message: `⏰ Reminder snoozed for "${activity.title}" — you'll be reminded again in ${minutes} minutes.`,
      status:  'unread',
    });

    res.json({ success: true, activity, message: `Snoozed for ${minutes} minutes` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};