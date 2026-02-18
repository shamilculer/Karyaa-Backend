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

    // Media type: image or video
    mediaType: {
      type: String,
      enum: ['image', 'video'],
      default: 'image',
      required: true,
    },

    // Optional thumbnail URL for videos
    thumbnail: {
      type: String,
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