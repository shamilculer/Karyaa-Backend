import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor", // Links the review to the Vendor model
      required: [true, "Vendor ID is required for the review"],
      index: true, // Index this field for fast lookups
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client", // Assuming a separate model for clients/users
      required: [true, "Client ID is required"],
    },
    clientName: {
      type: String, // Store client name redundancy for easier display
      required: true,
      trim: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: [true, "Rating value is required (1-5)"],
    },
    comment: {
      type: String,
      trim: true,
      required: [true, "Review comment is required"],
    },
    // 💡 Admin Approval Field
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending", // New reviews require admin approval before being shown
      index: true, // Index this field for quickly fetching 'Approved' reviews
    },
    // Field to store details about the event or service type (optional but helpful)
    serviceType: {
      type: String,
      trim: true,
      maxlength: 50,
    },
  },
  { timestamps: true } // Adds createdAt and updatedAt fields
);

// Add a unique index to prevent a client from reviewing the same vendor multiple times
reviewSchema.index({ vendor: 1, client: 1 }, { unique: true });

const Review = mongoose.model("Review", reviewSchema);

export default Review;