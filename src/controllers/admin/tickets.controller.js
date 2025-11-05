import Ticket from "../../models/Ticket.model.js";
// import Vendor from "../../models/Vendor.model.js";

export const getAllSupportTickets = async (req, res) => {
    try {
        if (!req.user || req.user.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Access denied. Only admins can view all support tickets.",
            });
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 15;
        const search = req.query.search || "";
        const statusFilter = req.query.status;
        const categoryFilter = req.query.category;
        const priorityFilter = req.query.priority;

        const query = {};

        const validStatuses = ['open', 'in-progress', 'pending', 'closed'];
        const validCategories = ['Leads', 'profile', 'technical', 'content', 'other'];
        const validPriorities = ['low', 'medium', 'high', 'critical'];


        // 3. Build Query Object
        
        // Search Filter (by subject)
        if (search) {
            query.subject = { $regex: search, $options: "i" };
        }

        if (statusFilter && validStatuses.includes(statusFilter.toLowerCase())) {
            query.status = statusFilter.toLowerCase();
        }

        if (categoryFilter && validCategories.includes(categoryFilter)) {
            query.category = categoryFilter;
        }

        if (priorityFilter && validPriorities.includes(priorityFilter.toLowerCase())) {
            query.priority = priorityFilter.toLowerCase();
        }

        const total = await Ticket.countDocuments(query);

        const tickets = await Ticket.find(query)
            .populate("submittedBy", "ownerName ownerProfileImage") 
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

            console.log(tickets)

        res.status(200).json({
            success: true,
            count: tickets.length,
            total,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            tickets,
        });
    } catch (error) {
        console.error("Error fetching support tickets:", error);
        res.status(500).json({ 
            success: false, 
            message: error.message || "An unexpected error occurred while fetching tickets." 
        });
    }
};

export const updateTicketStatus = async (req, res) => {
    try {
        // 1. Authorization Check
        if (!req.user || req.user.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Access denied. Only admins can update ticket status.",
            });
        }

        // 2. Extract Data
        const { id } = req.params;
        const { status } = req.body;

        // 3. Validation
        if (!status) {
            return res.status(400).json({
                success: false,
                message: "New status is required.",
            });
        }

        const validStatuses = ['open', 'in-progress', 'pending', 'closed'];
        const normalizedStatus = status.toLowerCase();

        if (!validStatuses.includes(normalizedStatus)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status value. Must be one of: ${validStatuses.join(", ")}`,
            });
        }

        // 4. Update Ticket in Database
        const updatedTicket = await Ticket.findByIdAndUpdate(
            id,
            { 
                status: normalizedStatus,
                updatedAt: new Date() 
            },
            { new: true }
        );

        if (!updatedTicket) {
            return res.status(404).json({
                success: false,
                message: "Ticket not found.",
            });
        }

        // 5. Success Response
        res.status(200).json({
            success: true,
            message: `Ticket ID ${id} status successfully updated to: ${normalizedStatus.replace('-', ' ')}.`,
        });
    } catch (error) {
        console.error("Error updating ticket status:", error);

        // Handle CastError (invalid ticket ID format)
        if (error.name === 'CastError') {
            return res.status(400).json({ 
                success: false, 
                message: "Invalid ticket ID format."
            });
        }

        res.status(500).json({
            success: false,
            message: error.message || "An unexpected error occurred while updating the ticket.",
        });
    }
};

export const deleteTicket = async (req, res) => {
    try {
        if (!req.user || req.user.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Access denied. Only admins can delete tickets.",
            });
        }

        const { id } = req.params;

        if (!id || id.length !== 24) {
            return res.status(400).json({
                success: false,
                message: "Invalid ticket ID format.",
            });
        }

        const deletedTicket = await Ticket.findByIdAndDelete(id);

        if (!deletedTicket) {
            return res.status(404).json({
                success: false,
                message: "Ticket not found.",
            });
        }

        return res.status(200).json({
            success: true,
            message: `Ticket ID ${id} was deleted successfully.`,
        });

    } catch (error) {
        console.error("Error deleting ticket:", error);

        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid ticket ID format.",
            });
        }

        return res.status(500).json({
            success: false,
            message: error.message || "An unexpected error occurred while deleting the ticket.",
        });
    }
};
