const mongoose = require('mongoose');

const checkpointLogSchema = new mongoose.Schema({
  checkpointId: { type: mongoose.Schema.Types.ObjectId, required: true },
  name: { type: String },
  qrValue: { type: String },
  status: { type: String, enum: ['completed', 'missed'], default: 'missed' },
  scannedAt: { type: Date, default: null }
});

const patrolLogSchema = new mongoose.Schema({
  route: { type: mongoose.Schema.Types.ObjectId, ref: 'PatrolRoute', required: true },
  guard: { type: mongoose.Schema.Types.ObjectId, ref: 'Guard' },
  date: { type: Date, default: Date.now },
  checkpoints: [checkpointLogSchema],
  status: { type: String, enum: ['in-progress', 'completed', 'incomplete'], default: 'in-progress' }
}, { timestamps: true });

module.exports = mongoose.model('PatrolLog', patrolLogSchema);
