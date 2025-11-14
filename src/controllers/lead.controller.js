import Lead from "../models/Lead.model.js";
import mongoose from "mongoose";

export const postLead = async (req, res) => {
    try {
      const {
        vendorId,
        fullName,
        phoneNumber,
        email,
        location,
        eventType,
        eventDate,
        numberOfGuests,
        message,
        user,
      } = req.body
  
      if (!vendorId || !fullName || !phoneNumber) {
        return res.status(400).json({
          success: false,
          message:
            "Missing mandatory contact information: Vendor ID, Full Name, and Phone Number are required.",
        })
      }
  
      const newLead = await Lead.create({
        vendor: vendorId,
        fullName,
        phoneNumber,
        email,
        location,
        eventType,
        eventDate,
        numberOfGuests,
        message,
        user: user || null,
      })
  
      return res.status(201).json({
        success: true,
        message: `Lead submitted successfully! Your reference ID is ${newLead.referenceId}. The vendor will be in touch shortly.`,
        data: newLead,
      })
    } catch (error) {
      console.error("Error posting lead:", error)
  
      if (error.name === "ValidationError") {
        return res.status(400).json({
          success: false,
          message: error.message,
          errors: error.errors,
        })
      }
  
      res.status(500).json({
        success: false,
        message: "Failed to submit lead due to a server error.",
      })
    }
  }
  

export const getVendorLeads = async (req, res) => {
    try {
        if (!req.user.role === "vendor" || !req.user.id) {
            return res.status(401).json({ 
                success: false, 
                message: "Authentication Required: You must be logged in as a vendor to view leads." 
            });
        }
        
        const vendorId = req.user.id; 

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const baseFilter = { 
            vendor: new mongoose.Types.ObjectId(vendorId) 
        };

        let finalFilter = { ...baseFilter };
        const { search, status, eventType } = req.query;

        if (search) {
            const searchRegex = new RegExp(search, 'i');
            
            finalFilter.$or = [
                { fullName: searchRegex },
                { phoneNumber: searchRegex },
                { email: searchRegex },
                { message: searchRegex },
                { referenceId: searchRegex },
            ];
        }

        if (status) {
            finalFilter.status = status;
        }

        if (eventType) {
            finalFilter.eventType = eventType;
        }


        const leads = await Lead.find(finalFilter)
            .sort({ createdAt: -1 }) // Sort newest leads first
            .skip(skip)
            .limit(limit)
            .exec();

        const totalLeads = await Lead.countDocuments(finalFilter);

        res.status(200).json({
            success: true,
            message: "Vendor leads fetched successfully.",
            data: leads,
            pagination: {
                totalItems: totalLeads,
                totalPages: Math.ceil(totalLeads / limit),
                currentPage: page,
                pageSize: limit,
            }
        });

    } catch (error) {
        console.error("Error fetching vendor leads:", error);
        res.status(500).json({ 
            success: false, 
            message: "Failed to fetch leads due to a server error." 
        });
    }
};

export const updateLeadStatus = async (req, res) => {
    try {
        if (req.user.role !== "vendor" || !req.user.id) {
            return res.status(401).json({ 
                success: false, 
                message: "Authentication Required: You must be logged in as a vendor to update leads." 
            });
        }

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

        const vendorId = req.user.id;

        const objectIds = idsArray.map(id => new mongoose.Types.ObjectId(id));

        const leadsCount = await Lead.countDocuments({
            _id: { $in: objectIds },
            vendor: new mongoose.Types.ObjectId(vendorId)
        });

        if (leadsCount !== idsArray.length) {
            return res.status(403).json({
                success: false,
                message: "Access denied: Some leads do not belong to you or do not exist."
            });
        }

        const updateResult = await Lead.updateMany(
            {
                _id: { $in: objectIds },
                vendor: new mongoose.Types.ObjectId(vendorId)
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


export const deleteLead = async (req, res) => {
    try {
        if (req.user.role !== "vendor" || !req.user.id) {
            return res.status(401).json({ 
                success: false, 
                message: "Authentication Required: You must be logged in as a vendor to delete leads." 
            });
        }

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

        const vendorId = req.user.id;

        const objectIds = idsArray.map(id => new mongoose.Types.ObjectId(id));

        const leadsCount = await Lead.countDocuments({
            _id: { $in: objectIds },
            vendor: new mongoose.Types.ObjectId(vendorId)
        });

        if (leadsCount !== idsArray.length) {
            return res.status(403).json({
                success: false,
                message: "Access denied: Some leads do not belong to you or do not exist."
            });
        }

        const deleteResult = await Lead.deleteMany({
            _id: { $in: objectIds },
            vendor: new mongoose.Types.ObjectId(vendorId)
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