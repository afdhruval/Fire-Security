const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
    {
        senderName: { type: String, required: [true, 'Sender name is required'], trim: true },
        message: { type: String, required: [true, 'Message is required'] },
        timestamp: { type: Date, default: Date.now },
    },
    { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

module.exports = mongoose.model('Message', messageSchema);
