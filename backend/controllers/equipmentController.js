const Equipment = require('../models/Equipment');

exports.getAll = async (req, res, next) => {
    try {
        const equipment = await Equipment.find()
            .populate('site', 'siteName location')
            .sort('-createdAt');
        res.status(200).json({ success: true, equipment });
    } catch (err) {
        next(err);
    }
};

exports.create = async (req, res, next) => {
    try {
        const equipment = await Equipment.create(req.body);
        res.status(201).json({ success: true, equipment });
    } catch (err) {
        next(err);
    }
};

exports.update = async (req, res, next) => {
    try {
        const equipment = await Equipment.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!equipment) return res.status(404).json({ success: false, message: 'Equipment not found' });
        res.status(200).json({ success: true, equipment });
    } catch (err) {
        next(err);
    }
};

exports.remove = async (req, res, next) => {
    try {
        const equipment = await Equipment.findByIdAndDelete(req.params.id);
        if (!equipment) return res.status(404).json({ success: false, message: 'Equipment not found' });
        res.status(200).json({ success: true, message: 'Equipment deleted' });
    } catch (err) {
        next(err);
    }
};