const mongoose = require('mongoose');

const siteSchema = new mongoose.Schema(
    {
        siteName: { type: String, required: [true, 'Site name is required'], trim: true },
        location: { type: String, required: [true, 'Location is required'], trim: true },
        client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
        guards: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Guard' }],
    },
    { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

module.exports = mongoose.model('Site', siteSchema);
