import mongoose from 'mongoose';

const JobApplicationSchema = new mongoose.Schema({
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JobPosting',
    required: true,
  },
  applicationId: {
    type: String,
    unique: true,
  },
  basicInfo: {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    mobile: { type: String, required: true, trim: true },
    gender: { type: String, required: true, enum: ['Male', 'Female', 'Other', 'Prefer not to say'] },
    dateOfBirth: { type: Date, required: true },
    nationality: { type: String, required: true },
  },
  addressInfo: {
    city: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },
    currentCity: { type: String, required: true, trim: true },
  },
  professionalDetails: {
    currentJobTitle: { type: String, required: true, trim: true },
    currentEmployer: { type: String, required: true, trim: true },
    availableToStart: { type: String, required: true },
  },
  socialNetwork: {
    facebook: { type: String, trim: true },
    linkedin: { type: String, trim: true },
    instagram: { type: String, trim: true },
  },
  attachments: {
    photo: { type: String }, // URL
    resume: { type: String, required: true }, // URL
    photo1: { type: String }, // URL
  },
  status: {
    type: String,
    enum: ['Pending', 'Reviewed', 'Rejected', 'Hired'],
    default: 'Pending',
  },
}, {
  timestamps: true,
});

// Pre-save hook to generate unique applicationId
JobApplicationSchema.pre('save', async function (next) {
  if (!this.isNew) {
    return next();
  }

  try {
    const today = new Date();
    const dateStr = today.getFullYear().toString() +
      String(today.getMonth() + 1).padStart(2, '0') +
      String(today.getDate()).padStart(2, '0');

    // Find the latest application for today to increment the counter
    const latestApp = await this.constructor.findOne({
      applicationId: new RegExp(`^APP-${dateStr}-`)
    }).sort({ applicationId: -1 });

    let sequence = 1;
    if (latestApp && latestApp.applicationId) {
      const lastSequence = parseInt(latestApp.applicationId.split('-')[2], 10);
      if (!isNaN(lastSequence)) {
        sequence = lastSequence + 1;
      }
    }

    this.applicationId = `APP-${dateStr}-${String(sequence).padStart(4, '0')}`;
    next();
  } catch (error) {
    next(error);
  }
});

export default mongoose.model('JobApplication', JobApplicationSchema);
