import mongoose from "mongoose";

const galleryItemSchema = new mongoose.Schema(
  {
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
      index: true, // Faster vendor gallery queries
    },

    url: {
      type: String,
      required: true,
      trim: true,
    },

    // Display prioritization
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },

    // Drag-and-drop sortable ordering
    orderIndex: {
      type: Number,
      default: 0,
      index: true,
    },
  },
  { timestamps: true }
);

// Helpful compound index for global feed
galleryItemSchema.index({ createdAt: -1 });

const GalleryItem = mongoose.models.GalleryItem || mongoose.model("GalleryItem", galleryItemSchema);

export default GalleryItem;