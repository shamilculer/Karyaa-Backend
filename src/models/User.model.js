import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcrypt';

export const BaseUserSchemaDefinition = {
    username: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        maxlength: 30,
    },
    emailAddress: {
        type: String,
        required: [true, 'Email is required'],
        unique: [true, 'Email must be unique'],
        lowercase: true,
        trim: true,
    },
    mobileNumber: {
        type: String,
        required: [true, 'Mobile Number is required'],
        unique: true,
        trim: true,
        match: [
            /^(?:(?:\+|00)971)?(?:0)?(5[0-9]{8})$/,
            'Please enter a valid UAE mobile number',
        ],
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false,
    },
    location: {
        type: String,
        required: [true, 'Location (City/Area) is required'],
        trim: true,
    },

    // --- Profile Image ---
    profileImage: {
        type: String,
        trim: true,
        default:
            'https://ui-avatars.com/api/?background=random&color=fff&name=User',
    },

    // 🌟 NEW FIELD: Saved Vendors
    savedVendors: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Vendor', // 👈 IMPORTANT: Replace 'Vendor' with the actual name of your Vendor model if it's different
        },
    ],
    // ----------------------

    // --- Role Field ---
    role: {
        type: String,
        enum: ['user', 'vendor', 'admin'], // you can adjust roles as needed
        default: 'user',
    },

    // --- Verification and Status Fields ---
    isVerified: {
        type: Boolean,
        default: false,
    },

    // --- Security Fields ---
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
};

// --- Schema Instance ---
const UserSchema = new Schema(BaseUserSchemaDefinition, { timestamps: true });

// --- Hooks ---
UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    this.passwordChangedAt = Date.now() - 1000;
    next();
});

// --- Methods ---
UserSchema.methods.correctPassword = async function (
    candidatePassword,
    userPasswordHash
) {
    return await bcrypt.compare(candidatePassword, userPasswordHash);
};

// --- Model ---
const User = mongoose.model('User', UserSchema);

export default User;