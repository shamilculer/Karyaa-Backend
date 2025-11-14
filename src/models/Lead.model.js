import mongoose, { Schema } from "mongoose"
import { customAlphabet } from "nanoid"

const leadSchema = new Schema(
  {
    referenceId: {
      type: String,
      unique: true,
      trim: true,
      uppercase: true,
      minlength: 3,
      maxlength: 4,
    },
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
    
    let unique = false
    let id // Declare id here, outside the loop
    const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const nanoid_custom = customAlphabet(alphabet, 4) 
    
    while (!unique) {
      id = nanoid_custom() // Remove 'const' - just assign to the existing variable
      const exists = await this.constructor.findOne({ referenceId: id })
      if (!exists) {
        unique = true
      }
    }
    
    this.referenceId = id // Now id has a value
    next()
  })

const Lead = mongoose.models.Lead || mongoose.model("Lead", leadSchema)
export default Lead
