// backend/utils/scheduler.js
// npm install node-cron

const cron     = require('node-cron');
const Guard    = require('../models/Guard');
const Activity = require('../models/Activity');
const Alert    = require('../models/Alert');

const startScheduler = () => {

  // ── Every 5 mins: guard shift-end + activity reminders ─────────────────
  cron.schedule('*/5 * * * *', async () => {
    try {
      const now = new Date();

      // ── 1. Guard shift-end check ────────────────────────────────────────
      const activeGuards = await Guard.find({ status: 'active', lastCheckIn: { $ne: null } });

      for (const guard of activeGuards) {
        if (!guard.lastCheckIn) continue;
        const shiftEnd = new Date(guard.lastCheckIn.getTime() + (guard.shiftHours || 8) * 60 * 60 * 1000);

        if (now >= shiftEnd) {
          guard.status = 'inactive';
          await guard.save();

          await Alert.create({
            type:    'guard',
            message: `🔴 Guard ${guard.name}'s ${guard.shiftHours}-hour shift has ended — automatically set to Inactive.`,
            guardId: guard._id,
            status:  'unread',
          });
          console.log(`[Scheduler] ${guard.name} shift ended — marked Inactive`);
        }
      }

      // ── 2. Activity: 30-min reminder ────────────────────────────────────
      // Find upcoming activities whose time is between now+25min and now+35min
      // (10-min window so we don't double-fire if cron runs slightly late)
      const in25 = new Date(now.getTime() + 25 * 60 * 1000);
      const in35 = new Date(now.getTime() + 35 * 60 * 1000);

      const soonActivities = await Activity.find({
        status: 'upcoming',
        time:   { $gte: in25.toISOString(), $lte: in35.toISOString() },
        reminded30: { $ne: true },   // don't fire twice
      });

      for (const act of soonActivities) {
        const actTime = new Date(act.time).toLocaleString('en-IN', {
          hour: '2-digit', minute: '2-digit', hour12: true
        });
        await Alert.create({
          type:    'system',
          message: `⏰ Reminder: Activity "${act.title}" is starting in 30 minutes at ${actTime}${act.assignedGuard?.name ? ` — assigned to ${act.assignedGuard.name}` : ''}.`,
          status:  'unread',
        });

        // Mark so we don't alert again
        act.reminded30 = true;
        await act.save();
        console.log(`[Scheduler] 30-min reminder sent for "${act.title}"`);
      }

      // ── 3. Activity: overdue check ──────────────────────────────────────
      // Upcoming activities whose time has passed — not yet alerted as overdue
      const overdueActivities = await Activity.find({
        status:        'upcoming',
        time:          { $lt: now.toISOString() },
        overdueAlerted: { $ne: true },
      });

      for (const act of overdueActivities) {
        const actTime = new Date(act.time).toLocaleString('en-IN', {
          day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true
        });
        await Alert.create({
          type:    'system',
          message: `🚨 Activity "${act.title}" is OVERDUE! It was scheduled for ${actTime}${act.assignedGuard?.name ? ` (assigned to ${act.assignedGuard.name})` : ''}.`,
          status:  'unread',
        });

        act.overdueAlerted = true;
        await act.save();
        console.log(`[Scheduler] Overdue alert sent for "${act.title}"`);
      }

    } catch (err) {
      console.error('[Scheduler] Error in 5-min check:', err.message);
    }
  });

  // ── Midnight reset — all guards inactive ────────────────────────────────
  cron.schedule('1 0 * * *', async () => {
    try {
      const result = await Guard.updateMany(
        { status: 'active' },
        { status: 'inactive', lastCheckIn: null }
      );

      // Also reset reminder flags on activities for the new day
      await Activity.updateMany(
        { reminded30: true },
        { reminded30: false }
      );

      console.log(`[Scheduler] Midnight reset — ${result.modifiedCount} guards set to Inactive`);
    } catch (err) {
      console.error('[Scheduler] Midnight reset error:', err.message);
    }
  });

  console.log('[Scheduler] Guard shift + Activity notification scheduler started ✓');
};

module.exports = { startScheduler };