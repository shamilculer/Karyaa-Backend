import mongoose from "mongoose";

const contentSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  type: {
    type: String,
    required: true,
    enum: ['page', 'section', 'faq', 'setting'],
  },
  content: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
  },
}, {
  timestamps: true,
});

contentSchema.index({ key: 1 });
contentSchema.index({ type: 1 });

contentSchema.statics.getByKey = async function(key) {
  return await this.findOne({ key });
};

contentSchema.statics.getByKeys = async function(keys) {
  return await this.find({ key: { $in: keys } });
};

contentSchema.statics.getByType = async function(type) {
  return await this.find({ type }).sort({ key: 1 });
};

const Content = mongoose.model('Content', contentSchema);

export default Content