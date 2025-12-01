import mongoose from "mongoose";
import bcrypt from "bcrypt";

const adminSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "Full Name is required"],
      trim: true,
      index: true,
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    phoneNumber: {
      type: String,
      trim: true,
      default: "",
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
    },

    profileImage: {
      type: String,
      trim: true,
      default: "",
    },
    /** 
     * High-level user type
     * This helps differentiate in the DB and login guard
     */
    role: {
      type: String,
      enum: ["user", "vendor", "admin"],
      default: "admin",
      index: true,
    },

    /**
     * Admin permission level:
     * super-admin = full access
     * restricted-admin = limited module access
     */
    adminLevel: {
      type: String,
      enum: ["admin", "moderator"],
      default: "moderator",
      index: true,
    },

    /**
     * Module-based permissions
     * The items mapped directly from your sidebar
     */
    accessControl: {
      dashboard: { type: Boolean, default: true },
      contentModeration: { type: Boolean, default: false },
      categoryManagement: { type: Boolean, default: false },
      vendorManagement: { type: Boolean, default: false },
      reviewManagement: { type: Boolean, default: false },
      leadsManagement: { type: Boolean, default: false },
      analyticsInsights: { type: Boolean, default: false },
      supportTickets: { type: Boolean, default: false },
      adManagement: { type: Boolean, default: false },
      referralManagement: { type: Boolean, default: false },
      bundleManagement: { type: Boolean, default: false },
      adminUserSettings: { type: Boolean, default: false },
      adminSettings: { type: Boolean, default: true },
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

/* --------------------- PRE SAVE HOOKS ---------------------- */
adminSchema.pre("save", async function (next) {

  // Dynamic avatar
  if (!this.profileImage && this.fullName) {
    const formattedName = encodeURIComponent(this.fullName.trim());
    this.profileImage = `https://ui-avatars.com/api/?background=random&color=fff&name=${formattedName}`;
  }

  // Password hashing
  if (this.isModified("password")) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }

  next();
});

/* ---------------------- INDEX OPTIMIZATIONS ----------------------- */
adminSchema.index({ adminLevel: 1, isActive: 1 });

const Admin = mongoose.model("Admin", adminSchema);
export default Admin;
