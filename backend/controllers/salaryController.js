const Salary = require('../models/Salary');
const Invoice = require('../models/Invoice');
const mongoose = require('mongoose');

exports.getAll = async (req, res, next) => {
  try {
    const salaries = await Salary.find()
      .populate('guard', 'name phone salary')
      .sort('-createdAt');
    res.status(200).json({ success: true, salaries });
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const salary = await Salary.create(req.body);

    // ── TASK 4: Auto-generate invoice ───────────────────────────────────────
    // One invoice per guard per month — skip if it already exists
    const existing = await Invoice.findOne({
      guard:       salary.guard,
      month:       salary.month,
      invoiceType: 'salary',
    });

    if (!existing) {
      await Invoice.create({
        guard:       salary.guard,
        salaryRef:   salary._id,
        amount:      salary.totalSalary,
        month:       salary.month,
        status:      salary.paymentStatus === 'Paid' ? 'paid' : 'unpaid',
        invoiceType: 'salary',
      });
    }
    // ────────────────────────────────────────────────────────────────────────

    res.status(201).json({ success: true, salary });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const salary = await Salary.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!salary) return res.status(404).json({ success: false, message: 'Salary not found' });
    res.status(200).json({ success: true, salary });
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const salary = await Salary.findByIdAndDelete(req.params.id);
    if (!salary) return res.status(404).json({ success: false, message: 'Salary not found' });
    res.status(200).json({ success: true, message: 'Salary deleted' });
  } catch (err) {
    next(err);
  }
};

// Mark salary as paid — also syncs linked auto-invoice to 'paid'
exports.markPaid = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid salary ID' });
    }
    const salary = await Salary.findById(id);
    if (!salary) return res.status(404).json({ success: false, message: 'Salary not found' });

    salary.paymentStatus = 'Paid';
    salary.paymentDate = new Date();
    await salary.save();

    // ── TASK 4: Sync auto-invoice status to 'paid' ──────────────────────────
    await Invoice.findOneAndUpdate(
      { salaryRef: salary._id, invoiceType: 'salary' },
      { status: 'paid' }
    );
    // ────────────────────────────────────────────────────────────────────────

    res.status(200).json({ success: true, salary });
  } catch (err) {
    console.error('Error marking salary paid:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};