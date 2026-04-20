const Invoice = require('../models/Invoice');

exports.getAll = async (req, res, next) => {
    try {
        const invoices = await Invoice.find()
            .populate('client', 'clientName companyName')
            .populate('guard',  'name phone')
            .sort('-createdAt');
        // Return both keys for compatibility with old and new frontend
        res.status(200).json({ success: true, invoices, data: invoices });
    } catch (err) {
        next(err);
    }
};

exports.create = async (req, res, next) => {
    try {
        const invoice = await Invoice.create(req.body);
        res.status(201).json({ success: true, invoice });
    } catch (err) {
        next(err);
    }
};

exports.update = async (req, res, next) => {
    try {
        const invoice = await Invoice.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
        res.status(200).json({ success: true, invoice });
    } catch (err) {
        next(err);
    }
};

exports.markPaid = async (req, res, next) => {
    try {
        const invoice = await Invoice.findByIdAndUpdate(
            req.params.id,
            { status: 'paid' },
            { new: true }
        );
        if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
        res.status(200).json({ success: true, invoice });
    } catch (err) {
        next(err);
    }
};

exports.remove = async (req, res, next) => {
    try {
        const invoice = await Invoice.findByIdAndDelete(req.params.id);
        if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
        res.status(200).json({ success: true, message: 'Invoice deleted' });
    } catch (err) {
        next(err);
    }
};
