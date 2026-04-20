const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema(
    {
        // Client-linked invoice (manual)
        client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', default: null },
        // Guard-linked invoice (auto-generated from salary)
        guard:  { type: mongoose.Schema.Types.ObjectId, ref: 'Guard',  default: null },
        // Reference to the originating salary record (prevents duplicates)
        salaryRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Salary', default: null, unique: false },
        amount: { type: Number, required: [true, 'Amount is required'] },
        month:  { type: String, required: [true, 'Month is required'] },
        status: { type: String, enum: ['paid', 'unpaid'], default: 'unpaid' },
        // 'manual' = created by user; 'salary' = auto-generated from salary record
        invoiceType: { type: String, enum: ['manual', 'salary'], default: 'manual' },
    },
    { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Prevent duplicate auto-invoices: one invoice per guard per month (salary type only)
invoiceSchema.index({ guard: 1, month: 1, invoiceType: 1 }, {
  unique: true,
  partialFilterExpression: { invoiceType: 'salary', guard: { $ne: null } },
});

module.exports = mongoose.model('Invoice', invoiceSchema);

