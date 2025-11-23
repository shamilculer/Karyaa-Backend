import Lead from "../../models/Lead.model.js";
import mongoose from "mongoose";

/**
 * @desc Get all leads system-wide (Admin only)
 * @route GET /api/v1/admin/leads
 * @access Admin
 */
export const adminGetAllLeads = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const { search, status, vendorId } = req.query;

        let query = {};

        if (search) {
            const searchRegex = new RegExp(search, 'i');
            query.$or = [
                { fullName: searchRegex },
                { phoneNumber: searchRegex },
                { email: searchRegex },
                { message: searchRegex },
                { referenceId: searchRegex },
            ];
        }

        if (status && status !== 'All') {
            query.status = status;
        }

        if (vendorId) {
            query.vendor = new mongoose.Types.ObjectId(vendorId);
        }

        const leads = await Lead.find(query)
            .populate({
                path: "vendor",
                select: "businessName email phoneNumber ownerName",
            })
            .populate({
                path: "user",
                select: "username email mobileNumber",
            })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .exec();

        const totalLeads = await Lead.countDocuments(query);

        res.status(200).json({
            success: true,
            message: "All leads fetched successfully.",
            data: leads,
            pagination: {
                totalItems: totalLeads,
                totalPages: Math.ceil(totalLeads / limit),
                currentPage: page,
                pageSize: limit,
            }
        });

    } catch (error) {
        console.error("Error fetching all leads:", error);
        res.status(500).json({ 
            success: false, 
            message: "Failed to fetch leads due to a server error." 
        });
    }
};

/**
 * @desc Admin update lead status
 * @route PATCH /api/v1/admin/leads/status
 * @access Admin
 */
export const adminUpdateLeadStatus = async (req, res) => {
    try {
        const { leadIds, status } = req.body;

        if (!leadIds || !status) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: leadIds and status are required."
            });
        }

        const idsArray = Array.isArray(leadIds) ? leadIds : [leadIds];

        if (idsArray.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No lead IDs provided."
            });
        }

        const validStatuses = ["New", "Contacted", "Closed - Won", "Closed - Lost"];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status. Allowed values are: ${validStatuses.join(", ")}`
            });
        }

        const objectIds = idsArray.map(id => new mongoose.Types.ObjectId(id));

        // Admin can update any lead, no vendor check needed
        const leadsCount = await Lead.countDocuments({
            _id: { $in: objectIds }
        });

        if (leadsCount !== idsArray.length) {
            return res.status(404).json({
                success: false,
                message: "Some leads do not exist."
            });
        }

        const updateResult = await Lead.updateMany(
            {
                _id: { $in: objectIds }
            },
            {
                $set: { status: status }
            }
        );

        const updatedLeads = await Lead.find({
            _id: { $in: objectIds }
        });

        const isBulk = idsArray.length > 1;
        const message = isBulk 
            ? `Successfully updated ${updateResult.modifiedCount} lead(s) to status: ${status}`
            : `Lead status updated to: ${status}`;

        return res.status(200).json({
            success: true,
            message,
            data: isBulk ? {
                modifiedCount: updateResult.modifiedCount,
                leads: updatedLeads
            } : updatedLeads[0]
        });

    } catch (error) {
        console.error("Error updating lead status:", error);

        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid lead ID format."
            });
        }

        res.status(500).json({ 
            success: false, 
            message: "Failed to update lead status due to a server error." 
        });
    }
};

/**
 * @desc Admin delete leads
 * @route DELETE /api/v1/admin/leads
 * @access Admin
 */
export const adminDeleteLead = async (req, res) => {
    try {
        const { leadIds } = req.body;

        if (!leadIds) {
            return res.status(400).json({
                success: false,
                message: "Lead ID(s) are required."
            });
        }

        const idsArray = Array.isArray(leadIds) ? leadIds : [leadIds];

        if (idsArray.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No lead IDs provided."
            });
        }

        const objectIds = idsArray.map(id => new mongoose.Types.ObjectId(id));

        // Admin can delete any lead, no vendor check needed
        const leadsCount = await Lead.countDocuments({
            _id: { $in: objectIds }
        });

        if (leadsCount !== idsArray.length) {
            return res.status(404).json({
                success: false,
                message: "Some leads do not exist."
            });
        }

        const deleteResult = await Lead.deleteMany({
            _id: { $in: objectIds }
        });

        const isBulk = idsArray.length > 1;
        const message = isBulk 
            ? `Successfully deleted ${deleteResult.deletedCount} lead(s)`
            : `Lead deleted successfully`;

        return res.status(200).json({
            success: true,
            message,
            data: {
                deletedCount: deleteResult.deletedCount
            }
        });

    } catch (error) {
        console.error("Error deleting lead:", error);

        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid lead ID format."
            });
        }

        res.status(500).json({ 
            success: false, 
            message: "Failed to delete lead(s) due to a server error." 
        });
    }
};
