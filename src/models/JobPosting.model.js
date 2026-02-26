import mongoose from 'mongoose';

const JobPostingSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  jobId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  department: {
    type: String,
    trim: true,
  },
  typeOfWork: {
    type: String,
    trim: true,
  },
  city: {
    type: String,
    required: true,
    trim: true,
  },
  stateProvince: {
    type: String,
    trim: true,
  },
  country: {
    type: String,
    required: true,
    trim: true,
  },
  zipCode: {
    type: String,
    trim: true,
  },
  experience: {
    type: String,
    trim: true,
  },
  applicationDeadline: {
    type: Date,
  },
  dateOpened: {
    type: Date,
  },
  image: {
    type: String, // URL to the header/background image
    trim: true,
  },
  body: {
    type: String, // HTML content for Job Description
    trim: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

export default mongoose.model('JobPosting', JobPostingSchema);
