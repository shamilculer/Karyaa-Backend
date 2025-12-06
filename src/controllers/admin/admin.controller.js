import Admin from "../../models/Admin.model.js"
import { generateTokens } from "../../utils/index.js";
import bcrypt from "bcrypt"

export const loginAdmin = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Fetch the admin, selecting the password field for comparison
        const admin = await Admin.findOne({ email }).select("+password");

        if (!admin) {
            return res
                .status(400)
                .json({ success: false, message: "Admin with this email address does not exist." });
        }

        // 🚨 NEW CHECK: Prevent login if the admin account is inactive
        if (!admin.isActive) {
            return res
                .status(403) // Use 403 Forbidden or 401 Unauthorized
                .json({ success: false, message: "Login failed. This administrator account is currently inactive." });
        }

        const isMatch = await bcrypt.compare(password, admin.password)
        if (!isMatch) {
            return res
                .status(400)
                .json({ success: false, message: "Invalid credentials (password)." });
        }

        const { accessToken, refreshToken } = generateTokens(admin);

        const adminResponse = {
            id: admin._id,
            fullName: admin.fullName,
            profileImage: admin.profileImage,
            role: admin.role,
            email: admin.email,
            phoneNumber: admin.phoneNumber,
            adminLevel: admin.adminLevel,
            accessControl: admin.accessControl
        };

        return res.status(200).json({
            success: true,
            message: "Admin login successful.",
            admin: adminResponse,
            accessToken,
            refreshToken,
        });

    } catch (error) {
        console.error("Admin login failed:", error);
        return res
            .status(500)
            .json({ success: false, message: "Server error during login." });
    }
}

export const getAllAdmins = async (req, res) => {

    try {

        if (!req.user || req.user.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Access denied. Only admins can create blog posts.",
            });
        }

        const {
            search = "",
            adminLevel = "",
            isActive = "",
            sortBy = "createdAt",
            sortOrder = "desc",
        } = req.query;

        // 1. Parse and validate limit (default to 15)
        const limit = parseInt(req.query.limit) || 15;

        // 2. Parse page (default to 1)
        let page = parseInt(req.query.page) || 1;

        // 🎯 FIX: Ensure page is always 1 or greater
        page = Math.max(1, page);

        // The skip calculation is now safe: (1 - 1) * 15 = 0
        const skip = (page - 1) * limit;

        // Base match query
        const matchQuery = {};

        if (adminLevel) matchQuery.adminLevel = adminLevel;
        if (isActive !== "") matchQuery.isActive = isActive === "true";

        // --------------------------
        // NO SEARCH CASE
        // --------------------------
        if (!search || search.trim() === "") {
            const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

            const admins = await Admin.find(matchQuery)
                .select(
                    "fullName email profileImage adminLevel accessControl isActive createdAt"
                )
                .sort(sort)
                .limit(limit) // Use the parsed limit
                .skip(skip); // Use the validated skip

            const total = await Admin.countDocuments(matchQuery);

            const formattedAdmins = admins.map((admin) => ({
                _id: admin._id,
                fullName: admin.fullName,
                email: admin.email,
                profileImage: admin.profileImage,
                adminLevel: admin.adminLevel,
                accessControl: admin.accessControl,
                isActive: admin.isActive,
                registeredAt: admin.createdAt,
            }));

            return res.status(200).json({
                success: true,
                data: formattedAdmins,
                pagination: {
                    total,
                    page,
                    pages: Math.ceil(total / limit),
                },
            });
        }

        // --------------------------
        // SEARCH CASE (Aggregation)
        // --------------------------
        const searchRegex = new RegExp(search, "i");

        const pipeline = [
            { $match: matchQuery },

            {
                $match: {
                    $or: [{ fullName: searchRegex }, { email: searchRegex }],
                },
            },

            {
                $project: {
                    fullName: 1,
                    email: 1,
                    profileImage: 1,
                    adminLevel: 1,
                    accessControl: 1,
                    isActive: 1,
                    createdAt: 1,
                }
            },

            {
                $sort: { [sortBy]: sortOrder === "asc" ? 1 : -1 },
            },

            {
                $facet: {
                    metadata: [{ $count: "total" }],
                    // Use the validated skip and parsed limit here
                    data: [{ $skip: skip }, { $limit: limit }],
                },
            },
        ];

        const result = await Admin.aggregate(pipeline);

        const total = result[0].metadata[0]?.total || 0;
        const admins = result[0].data || [];

        const formattedAdmins = admins.map((admin) => ({
            _id: admin._id,
            fullName: admin.fullName,
            email: admin.email,
            profileImage: admin.profileImage,
            adminLevel: admin.adminLevel,
            accessControl: admin.accessControl,
            isActive: admin.isActive,
            registeredAt: admin.createdAt,
        }));

        res.status(200).json({
            success: true,
            data: formattedAdmins,
            pagination: {
                total,
                page,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Error fetching admins:", error);

        res.status(500).json({
            success: false,
            message: error.message || "An error occurred while fetching admins",
        });
    }
};

export const createAdmin = async (req, res) => {

    if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({
            success: false,
            message: "Access denied. Only admins can create blog posts.",
        });
    }

    const { fullName, email, password, adminLevel, accessControl, profileImage } = req.body;

    if (!fullName || !email || !password) {
        return res.status(400).json({
            success: false,
            message: "Missing required fields: Full Name, Email, and Password are required."
        });
    }

    try {
        const existingAdmin = await Admin.findOne({ email });

        if (existingAdmin) {
            return res.status(409).json({ // 409 Conflict
                success: false,
                message: `An admin with email "${email}" already exists.`,
            });
        }

        // 2. Prepare data for model
        const adminData = {
            fullName,
            email,
            password,
            adminLevel: adminLevel || 'moderator',
            // Add profile image if provided
            ...(profileImage && { profileImage }),
            // LOGIC FIX: Check adminLevel and set permissions accordingly
            accessControl: (adminLevel === 'admin')
                ? {
                    // Full, unrestricted access for 'admin' level
                    dashboard: true, contentModeration: true, categoryManagement: true,
                    vendorManagement: true, reviewManagement: true, analyticsInsights: true,
                    supportTickets: true, adManagement: true, bundleManagement: true,
                    adminUserSettings: true, adminSettings: true, // Included all permissions
                }
                : (accessControl && typeof accessControl === 'object'
                    ? accessControl
                    : { // Apply a base set of permissions if none are provided for 'moderator'
                        dashboard: true,
                        contentModeration: false,
                        categoryManagement: false,
                        vendorManagement: false,
                        reviewManagement: false,
                        analyticsInsights: false,
                        supportTickets: false,
                        adManagement: false,
                        referralManagement: false,
                        bundleManagement: false,
                        adminUserSettings: false,
                        adminSettings: true,
                    }),
        };

        const newAdmin = new Admin(adminData);
        const createdAdmin = await newAdmin.save();

        const adminResponse = createdAdmin.toObject();
        delete adminResponse.password;

        res.status(201).json({ // 201 Created
            success: true,
            message: `Admin ${createdAdmin.fullName} created successfully.`,
            admin: adminResponse
        });

    } catch (error) {
        console.error("Error creating admin:", error);

        // 5. Handle Mongoose Validation Errors
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ // 400 Bad Request
                success: false,
                message: "Validation failed.",
                errors: errors
            });
        }

        // 6. Generic Server Error
        res.status(500).json({
            success: false,
            message: "Failed to create admin due to a server error."
        });
    }
};

export const toggleAdminStatus = async (req, res) => {
    if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({
            success: false,
            message: "Access denied. Only Admin users can manage administrator statuses.",
        });
    }

    const { id: adminIdToToggle } = req.params;

    if (req.user._id?.toString() || req.user.id?.toString() === adminIdToToggle) {
        return res.status(400).json({
            success: false,
            message: "Action forbidden. Admins cannot toggle their own status.",
        });
    }

    try {
        const targetAdmin = await Admin.findById(adminIdToToggle);

        if (!targetAdmin) {
            return res.status(404).json({
                success: false,
                message: "Target administrator not found.",
            });
        }

        if (req.user.adminLevel !== 'admin' && targetAdmin.adminLevel === 'admin') {
            return res.status(403).json({
                success: false,
                message: "Insufficient privilege. You cannot modify a Admin.",
            });
        }

        const newStatus = !targetAdmin.isActive;

        const updatedAdmin = await Admin.findByIdAndUpdate(
            adminIdToToggle,
            { isActive: newStatus },
            { new: true, runValidators: true }
        );

        return res.status(200).json({
            success: true,
            message: `Administrator ${updatedAdmin.fullName} status updated to ${newStatus ? 'Active' : 'Inactive'}.`,
            admin: updatedAdmin,
        });

    } catch (error) {
        console.error("Error toggling admin status:", error);
        return res.status(500).json({
            success: false,
            message: "An error occurred while attempting to toggle the admin status.",
        });
    }
};

export const deleteAdmin = async (req, res) => {
    if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({
            success: false,
            message: "Access denied. Only Admin users have the privilege to delete administrators.",
        });
    }

    const { id: adminIdToDelete } = req.params; // Get the ID from the URL parameter

    const userId = req.user._id?.toString() || req.user.id?.toString();

    if (userId === adminIdToDelete) {
        return res.status(400).json({
            success: false,
            message: "Action forbidden. Admins cannot delete their own account.",
        });
    }

    try {
        const targetAdmin = await Admin.findById(adminIdToDelete);

        if (!targetAdmin) {
            return res.status(404).json({
                success: false,
                message: "Target administrator not found.",
            });
        }

        if (req.user.adminLevel !== 'admin' && targetAdmin.adminLevel === 'admin') {
            return res.status(403).json({
                success: false,
                message: "Insufficient privilege. You cannot delete a Super Admin.",
            });
        }

        if (req.user.adminLevel === 'moderator' && targetAdmin.adminLevel === 'admin') {
            return res.status(403).json({
                success: false,
                message: "Insufficient privilege. You cannot delete a higher-level administrator.",
            });
        }

        await Admin.findByIdAndDelete(adminIdToDelete);

        return res.status(200).json({
            success: true,
            message: `Administrator ${targetAdmin.fullName} deleted permanently.`,
        });

    } catch (error) {
        console.error("Error deleting admin:", error);
        return res.status(500).json({
            success: false,
            message: "An error occurred while attempting to delete the administrator account.",
        });
    }
};

export const updateAdminAccessControl = async (req, res) => {
    if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({
            success: false,
            message: "Access denied. Only Admin users can manage administrator access control.",
        });
    }

    const { id: adminIdToUpdate } = req.params;
    const { accessControl: newAccessControl } = req.body;

    // 2. Self-Modification Guard (Admins cannot change their own permissions via this endpoint)
    const userId = req.user._id?.toString() || req.user.id?.toString();
    if (userId === adminIdToUpdate) {
        return res.status(400).json({
            success: false,
            message: "Action forbidden. Admins cannot modify their own permissions through this interface.",
        });
    }

    // 3. Input Validation
    if (!newAccessControl || typeof newAccessControl !== 'object') {
        return res.status(400).json({
            success: false,
            message: "Invalid or missing 'accessControl' data in the request body.",
        });
    }

    try {
        const targetAdmin = await Admin.findById(adminIdToUpdate);

        // 4. Admin Existence Check
        if (!targetAdmin) {
            return res.status(404).json({
                success: false,
                message: "Target administrator not found.",
            });
        }

        // 5. Hierarchy Guard: Prevent lower-level admins from modifying higher-level admins
        // 'moderator' cannot update 'admin'
        if (req.user.adminLevel !== 'admin' && targetAdmin.adminLevel === 'admin') {
            return res.status(403).json({
                success: false,
                message: "Insufficient privilege. You cannot modify the permissions of a Super Admin.",
            });
        }

        // 6. Prevent 'admin' level accounts from being downgraded
        // 'admin' level should always have full access (as defined in createAdmin)
        if (targetAdmin.adminLevel === 'admin') {
            return res.status(400).json({
                success: false,
                message: "Permissions for Super Admin accounts cannot be manually overridden. Use adminLevel change instead.",
            });
        }

        // 7. Update the accessControl field
        const updatedAdmin = await Admin.findByIdAndUpdate(
            adminIdToUpdate,
            { accessControl: newAccessControl },
            { new: true, runValidators: true }
        );

        // 8. Success Response
        return res.status(200).json({
            success: true,
            message: `Access control for ${updatedAdmin.fullName} updated successfully.`,
            admin: updatedAdmin,
        });

    } catch (error) {
        console.error("Error updating admin access control:", error);

        // Handle Mongoose Validation Errors (e.g., if a field type is wrong)
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: "Validation failed during permission update.",
                errors: errors
            });
        }

        // 9. Generic Server Error
        return res.status(500).json({
            success: false,
            message: "An error occurred while attempting to update admin permissions.",
        });
    }
};

// Update admin profile (name, email, phone number)
export const updateAdminProfile = async (req, res) => {
    if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({
            success: false,
            message: "Access denied. Only admins can update their profile.",
        });
    }

    const { fullName, username, email, phoneNumber, profileImage } = req.body;
    const adminId = req.user._id || req.user.id;

    try {
        // Check if email is being changed and if it's already taken
        if (email) {
            const existingAdmin = await Admin.findOne({
                email,
                _id: { $ne: adminId }
            });

            if (existingAdmin) {
                return res.status(409).json({
                    success: false,
                    message: "This email is already in use by another admin.",
                });
            }
        }

        // Prepare update data
        const updateData = {};
        // Accept both fullName and username (username is what's in the token)
        if (fullName) updateData.fullName = fullName;
        if (username) updateData.fullName = username;
        if (email) updateData.email = email;
        if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
        if (profileImage) updateData.profileImage = profileImage;

        // Update admin profile
        const updatedAdmin = await Admin.findByIdAndUpdate(
            adminId,
            updateData,
            { new: true, runValidators: true }
        ).select('-password');

        if (!updatedAdmin) {
            return res.status(404).json({
                success: false,
                message: "Admin not found.",
            });
        }

        // Map fullName to username for frontend compatibility
        const adminResponse = updatedAdmin.toObject();
        adminResponse.username = adminResponse.fullName;

        return res.status(200).json({
            success: true,
            message: "Profile updated successfully.",
            admin: adminResponse,
        });

    } catch (error) {
        console.error("Error updating admin profile:", error);

        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: "Validation failed.",
                errors: errors
            });
        }

        return res.status(500).json({
            success: false,
            message: "An error occurred while updating the profile.",
        });
    }
};

// Update admin password
export const updateAdminPassword = async (req, res) => {
    if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({
            success: false,
            message: "Access denied. Only admins can update their password.",
        });
    }

    const { currentPassword, newPassword } = req.body;
    const adminId = req.user._id || req.user.id;

    // Validation
    if (!currentPassword || !newPassword) {
        return res.status(400).json({
            success: false,
            message: "Both current password and new password are required.",
        });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({
            success: false,
            message: "New password must be at least 6 characters long.",
        });
    }

    try {
        // Get admin with password field
        const admin = await Admin.findById(adminId).select('+password');

        if (!admin) {
            return res.status(404).json({
                success: false,
                message: "Admin not found.",
            });
        }

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, admin.password);

        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: "Current password is incorrect.",
            });
        }

        // Update password (will be hashed by pre-save hook)
        admin.password = newPassword;
        await admin.save();

        return res.status(200).json({
            success: true,
            message: "Password updated successfully.",
        });

    } catch (error) {
        console.error("Error updating admin password:", error);

        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: "Validation failed.",
                errors: errors
            });
        }

        return res.status(500).json({
            success: false,
            message: "An error occurred while updating the password.",
        });
    }
};
