import mongoose from "mongoose";

const contactSubmissionSchema = new mongoose.Schema(
  {
    fullname: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
    message: { type: String, required: true },
    // Optional: track if email was sent
    emailSent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const ContactSubmission = mongoose.model("ContactSubmission", contactSubmissionSchema);

export default ContactSubmission