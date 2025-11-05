import Admin from "../../models/Admin.model.js"
import { generateTokens } from "../../utils/index.js";
import bcrypt from "bcrypt"

export const loginAdmin = async (req, res) => {
    const { email, password } = req.body;

        try {
            const admin = await Admin.findOne({ email }).select("+password");
    
            if (!admin) {
                return res
                    .status(400)
                    .json({ success: false, message: "Admin with this email address does not exist." });
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