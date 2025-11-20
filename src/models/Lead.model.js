import mongoose, { Schema } from "mongoose"
import { customAlphabet } from "nanoid"

const leadSchema = new Schema(
  {
    referenceId: {
      type: String,
      unique: true,
      trim: true,
      uppercase: true,
      // Increased length from 4 to 6 for better alphanumeric mix probability
      minlength: 6, 
      maxlength: 6,
    },
    // ... (Other fields remain the same)
    vendor: {
      type: Schema.Types.ObjectId,
      ref: "Vendor",
      required: [true, "Vendor ID is required"],
    },
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
    },
    email: {
      type: String,
      lowercase: true,
      required: [true, "Email address is required"],
      trim: true,
    },
    location: {
      type: String,
      trim: true,
    },
    eventType: String,
    eventDate: String,
    numberOfGuests: String,
    message: {
      type: String,
      trim: true,
      required: [true, "Message is required"],
      maxlength: 2000,
    },
    status: {
      type: String,
      enum: ["New", "Contacted", "Closed - Won", "Closed - Lost"],
      default: "New",
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
)

leadSchema.pre("save", async function (next) {
    if (!this.isNew) return next()

    // Define constants outside the loop
    const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    // Use a length of 6 for better uniqueness and alphanumeric distribution
    const ID_LENGTH = 6 
    const nanoid_custom = customAlphabet(ALPHABET, ID_LENGTH) 
    
    let id
    let isUnique = false
    
    while (!isUnique) {
      id = nanoid_custom()
      
      // Check if the generated ID already exists in the database
      const exists = await this.constructor.findOne({ referenceId: id })
      
      if (!exists) {
        isUnique = true
      }
    }
    
    this.referenceId = id
    next()
  })

const Lead = mongoose.models.Lead || mongoose.model("Lead", leadSchema)
export default Lead