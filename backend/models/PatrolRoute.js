const mongoose = require('mongoose');

const checkpointSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: { type: String, default: '' },
  qrValue: { type: String, required: true, unique: true },
  order: { type: Number, default: 0 }
});

const patrolRouteSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  assignedGuard: { type: mongoose.Schema.Types.ObjectId, ref: 'Guard', default: null },
  site: { type: mongoose.Schema.Types.ObjectId, ref: 'Site', default: null },
  checkpoints: [checkpointSchema],
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('PatrolRoute', patrolRouteSchema);
