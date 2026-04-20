const mongoose = require('mongoose');

const contractSchema = new mongoose.Schema({
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  terms: { type: String, default: '' },
  value: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'expired', 'pending'], default: 'active' }
}, { timestamps: true });

module.exports = mongoose.model('Contract', contractSchema);
