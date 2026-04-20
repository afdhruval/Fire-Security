const mongoose = require('mongoose');

const salarySchema = new mongoose.Schema({
  guard: { type: mongoose.Schema.Types.ObjectId, ref: 'Guard', required: true },
  month: { type: String, required: [true, 'Month is required'] },
  totalDaysPresent: { type: Number, required: true },
  totalSalary: { type: Number, required: true },
  paymentStatus: { type: String, enum: ['Unpaid', 'Paid'], default: 'Unpaid' },
  paymentDate: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Salary', salarySchema);