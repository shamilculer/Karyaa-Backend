import mongoose, { Schema } from "mongoose";

const leadSchema = new mongoose.Schema(
    {
        // Reference to the vendor who received the lead
        vendor: {
            type: Schema.Types.ObjectId,
            ref: "Vendor", // Assumes your Vendor model is named 'Vendor'
            required: [true, "Vendor ID is required"],
        },

        // User contact information
        fullName: {
            type: String,
            required: [true, "Full name is required"],
            trim: true,
            maxlength: 100,
        },
        phoneNumber: {
            type: String,
            required: [true, "Phone number is required"],
            trim: true,
            // You might want to add a match/validate for phone format here
        },
        email: {
            type: String,
            lowercase: true,
            trim: true,
            // Email is optional in your Zod schema, so we keep it optional here too.
        },

        // Event details
        location: {
            type: String,
            trim: true,
        },
        eventType: {
            type: String,
        },
        eventDate: {
            // Storing as a String (ISO Date string or 'YYYY-MM-DD') to align with your form input type="date"
            type: String, 
            trim: true,
        },
        numberOfGuests: {
            type: String,
            trim: true,
        },

        // User's message/description
        message: {
            type: String,
            trim: true,
            maxlength: 2000,
        },

        // Status/Tracking fields
        status: {
            type: String,
            enum: ["New", "Contacted", "Closed - Won", "Closed - Lost"],
            default: "New",
        },
        // Optional: Reference the user if they were logged in
        user: {
            type: Schema.Types.ObjectId,
            ref: "User", // Assumes your User model is named 'User'
            default: null,
        },
    },
    { timestamps: true }
);

// Create the Mongoose Model
const Lead = mongoose.model("Lead", leadSchema);

export default Lead;