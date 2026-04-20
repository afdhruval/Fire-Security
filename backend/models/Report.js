const mongoose = require('mongoose');

/**
 * Report Schema
 * Supports Fire, Security, and Incident report types
 * with timeline/status tracking and image attachments
 */
const reportSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Report title is required'],
            trim: true,
            maxlength: [200, 'Title cannot exceed 200 characters'],
        },

        type: {
            type: String,
            required: [true, 'Report type is required'],
            enum: {
                values: ['Fire', 'Security', 'Incident', 'Daily', 'Monthly'],
                message: 'Type must be Fire, Security, Incident, Daily, or Monthly',
            },
        },

        description: {
            type: String,
            required: [true, 'Description is required'],
            trim: true,
            maxlength: [5000, 'Description cannot exceed 5000 characters'],
        },

        location: {
            type: String,
            required: [true, 'Location is required'],
            trim: true,
        },

        severity: {
            type: String,
            enum: ['Low', 'Medium', 'High', 'Critical'],
            default: 'Medium',
        },

        status: {
            type: String,
            enum: {
                values: ['Pending', 'In Progress', 'Completed'],
                message: 'Status must be Pending, In Progress, or Completed',
            },
            default: 'Pending',
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'CreatedBy user is required'],
        },

        // Optional URL array — supports Cloudinary links or local paths
        images: {
            type: [String],
            default: [],
        },

        // Incident-specific extra fields
        incidentDate: {
            type: Date,
            default: Date.now,
        },

        // Status change audit trail
        timeline: [
            {
                status: { type: String },
                note: { type: String },
                changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
                changedAt: { type: Date, default: Date.now },
            },
        ],

        // Soft-delete support
        isDeleted: {
            type: Boolean,
            default: false,
            select: false,
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Index for common query patterns
reportSchema.index({ type: 1, status: 1, createdAt: -1 });
reportSchema.index({ createdBy: 1, createdAt: -1 });

module.exports = mongoose.model('Report', reportSchema);
