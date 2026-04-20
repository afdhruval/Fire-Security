const mongoose = require('mongoose');

const equipmentSchema = new mongoose.Schema(
    {
        equipmentName: { type: String, required: [true, 'Equipment name is required'], trim: true },
        type: {
            type: String,
            enum: ['Extinguisher', 'Alarm', 'CCTV', 'Hydrant'],
            required: [true, 'Type is required'],
        },
        quantity: { type: Number, required: true, default: 1 },
        site: { type: mongoose.Schema.Types.ObjectId, ref: 'Site', required: [true, 'Site is required'] },
        lastInspectionDate: { type: Date },
    },
    { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

module.exports = mongoose.model('Equipment', equipmentSchema);