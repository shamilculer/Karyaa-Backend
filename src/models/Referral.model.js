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
            unique: true, // Ensures no two referrals share the same code
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
            required: false, // Optional
            trim: true,
        },

        // --- Vendor Details (Array of Sub-Documents) ---
        vendors: {
            type: [vendorSchema], // Stores an array of Vendor sub-documents
            required: [true, "At least one vendor is required"],
            validate: {
                validator: (v) => v.length > 0,
                message: 'A referral must contain at least one vendor.',
            },
        },
        
        // --- Status/Tracking Fields (Optional) ---
        status: {
            type: String,
            enum: ["Pending", "Completed", "Canceled"],
            default: "Pending",
        },
    },
    { timestamps: true }
);

// --- PRE-SAVE HOOK: Generate and ensure unique Referral Code ---
referralSchema.pre('save', async function(next) {
    const doc = this;

    // Only run if the document is new and the code hasn't been set
    if (doc.isNew && !doc.referralCode) {
        let unique = false;
        let code;

        // Loop until a unique code is found
        while (!unique) {
            code = generateReferralCode(8); 
            
            // Check if a document with this code already exists
            // We use 'mongoose.models.Referral' here in case the model hasn't been exported yet
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