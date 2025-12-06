import mongoose, { Schema } from "mongoose";

// Utility function to generate a short, alphanumeric code
const generateReferralCode = (length = 8) => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

// --- Sub-Schema for a single Vendor ---
const vendorSchema = new mongoose.Schema({
  fullname: { 
    type: String, 
    required: [true, "Vendor full name is required"],
    trim: true,
  },
  email: { 
    type: String, 
    required: [true, "Vendor email is required"],
    lowercase: true,
    trim: true,
  },
  phone: { 
    type: String, 
    required: false, // Optional
    trim: true,
  },
}, { _id: false }); // Vendors are embedded documents, often don't need their own MongoDB ID

// --- Main Referral Schema ---
const referralSchema = new mongoose.Schema(
    {
        // --- AUTO-GENERATED REFERRAL CODE ---
        referralCode: {
            type: String,
            unique: true,
            index: true,
        },

        // --- Referrer Details ---
        referrerFullname: {
            type: String,
            required: [true, "Referrer name is required"],
            trim: true,
            maxlength: 100,
        },
        referrerEmail: {
            type: String,
            required: [true, "Referrer email is required"],
            lowercase: true,
            trim: true,
        },
        referrerPhone: {
            type: String,
            required: true,
            trim: true,
        },

        vendors: {
            type: [vendorSchema],
            required: [true, "At least one vendor is required"],
            validate: {
                validator: (v) => v.length > 0,
                message: 'A referral must contain at least one vendor.',
            },
        },
        
        status: {
            type: String,
            enum: ["Pending", "Completed", "Canceled"],
            default: "Pending",
        },
    },
    { timestamps: true }
);

referralSchema.pre('save', async function(next) {
    const doc = this;

    if (doc.isNew && !doc.referralCode) {
        let unique = false;
        let code;

        while (!unique) {
            code = generateReferralCode(8); 
            
            const existingReferral = await mongoose.models.Referral.findOne({ referralCode: code });
            
            if (!existingReferral) {
                unique = true;
            }
        }
        
        doc.referralCode = code;
    }
    
    next();
});

// Create the Mongoose Model
const Referral = mongoose.model("Referral", referralSchema);

export default Referral;