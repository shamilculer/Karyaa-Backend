import Complaint from '../models/Complaint.js';
import { sendEmail } from '../services/email.service.js';

// Create a new complaint
export const createComplaint = async (req, res) => {
    try {
        const { fullName, phoneNumber, email, description } = req.body;

        if (!fullName || !phoneNumber || !email || !description) {
            return res.status(400).json({ success: false, message: 'All fields are required.' });
        }

        const newComplaint = new Complaint({
            fullName,
            phoneNumber,
            email,
            description,
        });

        await newComplaint.save();

        // Send acknowledgement to user
        await sendEmail({
            to: email,
            template: 'complaint-received',
            data: {
                fullName,
                complaintId: newComplaint._id,
            },
        });

        // Send alert to admin
        await sendEmail({
            to: 'admin@placeholder.com', // Overridden by service
            template: 'admin-complaint-alert',
            data: {
                fullName,
                email,
                phoneNumber,
                description,
                complaintId: newComplaint._id,
            },
        });

        res.status(201).json({ success: true, message: 'Complaint raised successfully.', data: newComplaint });
    } catch (error) {
        console.error('Error raising complaint:', error);
        res.status(500).json({ success: false, message: 'Server error. Please try again later.' });
    }
};

// Get all complaints (Admin)
export const getAllComplaints = async (req, res) => {
    try {
        const complaints = await Complaint.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: complaints });
    } catch (error) {
        console.error('Error fetching complaints:', error);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// Update complaint status (Admin)
export const updateComplaintStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = ['Pending', 'In Progress', 'Resolved', 'Rejected'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status.' });
        }

        const updatedComplaint = await Complaint.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        );

        if (!updatedComplaint) {
            return res.status(404).json({ success: false, message: 'Complaint not found.' });
        }

        res.status(200).json({ success: true, message: 'Status updated successfully.', data: updatedComplaint });
    } catch (error) {
        console.error('Error updating complaint status:', error);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};
