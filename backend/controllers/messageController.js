const Message = require('../models/Message');

// GET /api/v1/messages
exports.getAll = async (req, res, next) => {
    try {
        const messages = await Message.find().sort('-timestamp');
        res.status(200).json({ success: true, messages });
    } catch (err) {
        next(err);
    }
};

// POST /api/v1/messages
exports.send = async (req, res, next) => {
    try {
        const msg = await Message.create({
            senderName: req.body.senderName,
            message: req.body.message,
            timestamp: new Date(),
        });
        res.status(201).json({ success: true, message: msg });
    } catch (err) {
        next(err);
    }
};
