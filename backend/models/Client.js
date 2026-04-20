const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema(
    {
        clientName: { type: String, required: [true, 'Client name is required'], trim: true },
        companyName: { type: String, required: [true, 'Company name is required'], trim: true },
        contactEmail: { type: String, trim: true, lowercase: true },
        contactPhone: { type: String, required: [true, 'Contact phone is required'], trim: true },
        address: { type: String, trim: true },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

module.exports = mongoose.model('Client', clientSchema);
