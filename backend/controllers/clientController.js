const Client = require('../models/Client');

// GET /api/v1/clients
exports.getAll = async (req, res, next) => {
    try {
        const clients = await Client.find().sort('-createdAt');
        res.status(200).json({ success: true, clients });
    } catch (err) {
        next(err);
    }
};

// POST /api/v1/clients
exports.create = async (req, res, next) => {
    try {
        const client = await Client.create(req.body);
        res.status(201).json({ success: true, client });
    } catch (err) {
        next(err);
    }
};

// PATCH /api/v1/clients/:id
exports.update = async (req, res, next) => {
    try {
        const client = await Client.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });
        if (!client) return res.status(404).json({ success: false, message: 'Client not found' });
        res.status(200).json({ success: true, client });
    } catch (err) {
        next(err);
    }
};

// DELETE /api/v1/clients/:id
exports.remove = async (req, res, next) => {
    try {
        const client = await Client.findByIdAndDelete(req.params.id);
        if (!client) return res.status(404).json({ success: false, message: 'Client not found' });
        res.status(200).json({ success: true, message: 'Client deleted' });
    } catch (err) {
        next(err);
    }
};
