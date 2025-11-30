import mongoose from "mongoose";

const WhatsAppClickSchema = new mongoose.Schema(
    {
        vendor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Vendor",
            required: true,
            index: true,
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        ip: {
            type: String,
            default: "unknown",
        },
        userAgent: {
            type: String,
            default: "",
        },
        clickedAt: {
            type: Date,
            default: Date.now,
            index: true,
        },
    },
    { timestamps: true }
);

const WhatsAppClick = mongoose.models.WhatsAppClick || mongoose.model("WhatsAppClick", WhatsAppClickSchema);

export default WhatsAppClick;
