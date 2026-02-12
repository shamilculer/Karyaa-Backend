import mongoose from 'mongoose';

const complaintSchema = new mongoose.Schema({
    complaintId: {
        type: String,
        unique: true,
    },
    fullName: {
        type: String,
        required: true,
    },
    phoneNumber: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ['Pending', 'In Progress', 'Resolved', 'Rejected'],
        default: 'Pending',
    },
}, {
    timestamps: true,
});

// Auto-generate complaint ID before saving
complaintSchema.pre('save', async function (next) {
    if (!this.complaintId) {
        // Get the count of existing complaints to generate sequential ID
        const count = await mongoose.model('Complaint').countDocuments();
        // Format: CMP-XXXXXX (6 digits, padded with zeros)
        this.complaintId = `CMP-${String(count + 1).padStart(6, '0')}`;
    }
    next();
});

const Complaint = mongoose.model('Complaint', complaintSchema);

export default Complaint;
