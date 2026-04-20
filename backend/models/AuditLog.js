const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  userName: { type: String, default: 'System' },
  action: { type: String, required: true },   // e.g. LOGIN, CREATE, UPDATE, DELETE
  module: { type: String, required: true },   // e.g. Guards, Attendance, Invoices
  details: { type: String, default: '' },
  ipAddress: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('AuditLog', auditLogSchema);
