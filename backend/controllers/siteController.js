const Site = require('../models/Site');

exports.getAll = async (req, res, next) => {
    try {
        const filter = req.query.client ? { client: req.query.client } : {};
        const sites = await Site.find(filter).populate('client', 'companyName').sort('-createdAt');
        res.status(200).json({ success: true, sites });
    } catch (err) {
        next(err);
    }
};

exports.create = async (req, res, next) => {
    try {
        const site = await Site.create(req.body);
        res.status(201).json({ success: true, site });
    } catch (err) {
        next(err);
    }
};

exports.update = async (req, res, next) => {
    try {
        const site = await Site.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!site) return res.status(404).json({ success: false, message: 'Site not found' });
        res.status(200).json({ success: true, site });
    } catch (err) {
        next(err);
    }
};

exports.remove = async (req, res, next) => {
    try {
        const site = await Site.findByIdAndDelete(req.params.id);
        if (!site) return res.status(404).json({ success: false, message: 'Site not found' });
        res.status(200).json({ success: true, message: 'Site deleted' });
    } catch (err) {
        next(err);
    }
};
