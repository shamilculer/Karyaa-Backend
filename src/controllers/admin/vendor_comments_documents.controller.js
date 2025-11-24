import Vendor from "../../models/Vendor.model.js";
import GalleryItem from "../../models/GalleryItem.model.js";
import Package from "../../models/Package.model.js";
import Bundle from "../../models/Bundle.model.js";
import mongoose from "mongoose";

// ... (existing controller functions) ...

// ==================== ADMIN COMMENTS ====================

// Add admin comment
export const addAdminComment = async (req, res) => {
    try {
        const { id } = req.params;
        const { message } = req.body;

        if (!message || !message.trim()) {
            return res.status(400).json({ 
                success: false, 
                message: "Comment message is required" 
            });
        }

        const vendor = await Vendor.findById(id);
        if (!vendor) {
            return res.status(404).json({ 
                success: false, 
                message: "Vendor not found" 
            });
        }

        vendor.adminComments.push({
            message: message.trim(),
            createdAt: new Date()
        });

        await vendor.save();

        res.status(200).json({
            success: true,
            message: "Comment added successfully",
            data: vendor.adminComments
        });
    } catch (error) {
        console.error("Error adding admin comment:", error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

// Delete admin comment
export const deleteAdminComment = async (req, res) => {
    try {
        const { id, commentId } = req.params;

        const vendor = await Vendor.findById(id);
        if (!vendor) {
            return res.status(404).json({ 
                success: false, 
                message: "Vendor not found" 
            });
        }

        const commentIndex = vendor.adminComments.findIndex(
            comment => comment._id.toString() === commentId
        );

        if (commentIndex === -1) {
            return res.status(404).json({ 
                success: false, 
                message: "Comment not found" 
            });
        }

        vendor.adminComments.splice(commentIndex, 1);
        await vendor.save();

        res.status(200).json({
            success: true,
            message: "Comment deleted successfully",
            data: vendor.adminComments
        });
    } catch (error) {
        console.error("Error deleting admin comment:", error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

// ==================== ADDITIONAL DOCUMENTS ====================

// Add additional document
export const addAdditionalDocument = async (req, res) => {
    try {
        const { id } = req.params;
        const { documentName, documentUrl } = req.body;

        if (!documentName || !documentName.trim()) {
            return res.status(400).json({ 
                success: false, 
                message: "Document name is required" 
            });
        }

        if (!documentUrl || !documentUrl.trim()) {
            return res.status(400).json({ 
                success: false, 
                message: "Document URL is required" 
            });
        }

        const vendor = await Vendor.findById(id);
        if (!vendor) {
            return res.status(404).json({ 
                success: false, 
                message: "Vendor not found" 
            });
        }

        vendor.additionalDocuments.push({
            documentName: documentName.trim(),
            documentUrl: documentUrl.trim(),
            uploadedAt: new Date()
        });

        await vendor.save();

        res.status(200).json({
            success: true,
            message: "Document added successfully",
            data: vendor.additionalDocuments
        });
    } catch (error) {
        console.error("Error adding additional document:", error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

// Delete additional document
export const deleteAdditionalDocument = async (req, res) => {
    try {
        const { id, documentId } = req.params;

        const vendor = await Vendor.findById(id);
        if (!vendor) {
            return res.status(404).json({ 
                success: false, 
                message: "Vendor not found" 
            });
        }

        const documentIndex = vendor.additionalDocuments.findIndex(
            doc => doc._id.toString() === documentId
        );

        if (documentIndex === -1) {
            return res.status(404).json({ 
                success: false, 
                message: "Document not found" 
            });
        }

        vendor.additionalDocuments.splice(documentIndex, 1);
        await vendor.save();

        res.status(200).json({
            success: true,
            message: "Document deleted successfully",
            data: vendor.additionalDocuments
        });
    } catch (error) {
        console.error("Error deleting additional document:", error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};
