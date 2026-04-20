const mongoose = require('mongoose');

const guardSchema = new mongoose.Schema({
  name:         { type: String, required: true, trim: true },
  phone:        { type: String, required: true, trim: true },
  salary:       { type: Number, default: 0 },
  assignedSite: { type: mongoose.Schema.Types.ObjectId, ref: 'Site', default: null },
  status:       { type: String, enum: ['active', 'inactive'], default: 'inactive' },

  // ── Link to auth user ──────────────────────────────────────────────────────
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

  // ── Shift fields ───────────────────────────────────────────────────────────
  shiftStartTime: { type: String, default: '09:00' },
  shiftHours:     { type: Number, default: 8 },
  lastCheckIn:    { type: Date,   default: null },

  // ── Scheduled reactivation ─────────────────────────────────────────────────
  reactivateAt: { type: Date, default: null },

  location: {
    latitude:   { type: Number, default: null },
    longitude:  { type: Number, default: null },
    updatedAt:  { type: Date,   default: null },
  },

  lastSeen: { type: Date, default: null },

  // ── Live Tracker fields (Admin-assigned) ───────────────────────────────────
  // Duty status visible on Live Tracker: On Duty / Leave / Off Duty / Break
  dutyStatus:    { type: String, enum: ['On Duty', 'Leave', 'Off Duty', 'Break'], default: 'Off Duty' },
  // Name of the preset Gujarat location assigned by Admin
  locationLabel: { type: String, default: '' },

}, { timestamps: true });

module.exports = mongoose.model('Guard', guardSchema);