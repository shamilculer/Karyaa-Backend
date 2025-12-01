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

        let matchStage = {};

        if (status && status !== 'All') {
            matchStage.status = status;
        }

        if (vendorId) {
            matchStage.vendor = new mongoose.Types.ObjectId(vendorId);
        }

        // Use aggregation pipeline to enable searching by vendor business name
        let pipeline = [];

        // First, lookup vendor data
        pipeline.push({
            $lookup: {
                from: 'vendors',
                localField: 'vendor',
                foreignField: '_id',
                as: 'vendorData'
            }
        });

        // Unwind vendor data (convert array to object)
        pipeline.push({
            $unwind: {
                path: '$vendorData',
                preserveNullAndEmptyArrays: true
            }
        });

        // Apply search filter if provided
        if (search) {
            const searchRegex = new RegExp(search, 'i');
            matchStage.$or = [
                { fullName: searchRegex },
                { phoneNumber: searchRegex },
                { email: searchRegex },
                { message: searchRegex },
                { referenceId: searchRegex },
                { 'vendorData.businessName': searchRegex }
            ];
        }

        // Apply match stage
        pipeline.push({ $match: matchStage });

        // Add facet for pagination and total count
        pipeline.push({
            $facet: {
                metadata: [{ $count: 'total' }],
                data: [
                    { $sort: { createdAt: -1 } },
                    { $skip: skip },
                    { $limit: limit },
                    // Lookup user data
                    {
                        $lookup: {
                            from: 'users',
                            localField: 'user',
                            foreignField: '_id',
                            as: 'userData'
                        }
                    },
                    {
                        $unwind: {
                            path: '$userData',
                            preserveNullAndEmptyArrays: true
                        }
                    },
                    // Project final shape
                    {
                        $project: {
                            fullName: 1,
                            phoneNumber: 1,
                            email: 1,
                            message: 1,
                            eventType: 1,
                            eventDate: 1,
                            location: 1,
                            status: 1,
                            referenceId: 1,
                            createdAt: 1,
                            updatedAt: 1,
                            vendor: {
                                _id: '$vendorData._id',
                                businessName: '$vendorData.businessName',
                                email: '$vendorData.email',
                                phoneNumber: '$vendorData.phoneNumber',
                                ownerName: '$vendorData.ownerName'
                            },
                            user: {
                                _id: '$userData._id',
                                username: '$userData.username',
                                email: '$userData.email',
                                mobileNumber: '$userData.mobileNumber'
                            }
                        }
                    }
                ]
            }
        });

        const result = await Lead.aggregate(pipeline);

        const leads = result[0]?.data || [];
        const totalLeads = result[0]?.metadata[0]?.total || 0;

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
