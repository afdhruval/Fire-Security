const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
    {
        guard: { type: mongoose.Schema.Types.ObjectId, ref: 'Guard', required: true },
        site: { type: mongoose.Schema.Types.ObjectId, ref: 'Site', required: true },
        date: { type: Date, required: true },
        status: { type: String, enum: ['present', 'absent'], default: 'absent' },
    },
    { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

module.exports = mongoose.model('Attendance', attendanceSchema);
