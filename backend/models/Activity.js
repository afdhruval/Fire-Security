const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  time: {
    type: String,
    required: true
  },
  location: {
    type: String,
    default: ''
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  assignedGuard: {
    name:    { type: String, default: '' },
    guardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Guard', default: null }
  },
  status: {
    type: String,
    enum: ['today', 'upcoming', 'completed'],
    default: 'today'
  },
  completionNote: {
    type: String,
    default: ''
  },
  addedBy: {
    name:   String,
    role:   String,
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },

  // ── Scheduler reminder flags ──────────────────────────────────────────
  reminded30:    { type: Boolean, default: false }, // true after 30-min alert sent
  overdueAlerted:{ type: Boolean, default: false }, // true after overdue alert sent

}, { timestamps: true });

module.exports = mongoose.model('Activity', activitySchema);