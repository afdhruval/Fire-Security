const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['fire', 'attendance', 'guard', 'incident', 'system'],
    required: true
  },
  message: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  guardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Guard', default: null },
  status: { type: String, enum: ['unread', 'read'], default: 'unread' },
}, { timestamps: true });

module.exports = mongoose.model('Alert', alertSchema);
