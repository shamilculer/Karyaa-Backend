import Lead from "../models/Lead.model.js";

/**
 * @description Creates a new lead/inquiry and saves it to the database.
 * @route POST /api/leads
 * @access Public (or protected based on your auth flow)
 */
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
        } = req.body;

        const userId = req.user ? req.user.id : null;

        if(!userId){
            return res.status(401).json({ 
                success: false, 
                message: "Unauthorized: User must be logged in to submit a lead." 
            });
        }

        // 2. Simple validation (Mongoose schema provides full validation)
        if (!vendorId || !fullName || !phoneNumber) {
            return res.status(400).json({ 
                success: false, 
                message: "Missing required fields: vendorId, full name, phone number, location, event type, event date, and number of guests are mandatory." 
            });
        }

        // 3. Create the new Lead document
        const newLead = await Lead.create({
            vendor: vendorId, // Maps to the 'vendor' field in the schema
            fullName,
            phoneNumber,
            email,
            location,
            eventType,
            eventDate,
            numberOfGuests,
            message,
            user: userId,
        });

        // 4. Send a success response
        res.status(201).json({
            success: true,
            message: "Lead submitted successfully! The vendor will be in touch shortly.",
            data: newLead,
        });

    } catch (error) {
        // Handle Mongoose validation errors or other server errors
        console.error("Error posting lead:", error);

        // Check for Mongoose validation error (e.g., failed required fields, enum validation)
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                message: error.message,
                errors: error.errors
            });
        }

        res.status(500).json({ 
            success: false, 
            message: "Failed to submit lead due to a server error." 
        });
    }
};