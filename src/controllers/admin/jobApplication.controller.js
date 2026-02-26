import JobApplication from '../../models/JobApplication.model.js';
import JobPosting from '../../models/JobPosting.model.js';
import { deleteS3Object, getKeyFromUrl } from '../../utils/s3.js';

/**
 * Helper — collects all attachment URLs from a job application and deletes them from S3.
 * Uses Promise.allSettled so one failed delete won't block others.
 * @param {object} application - Mongoose document with attachments field
 */
const deleteApplicationFiles = async (application) => {
    const urls = [
        application.attachments?.photo,
        application.attachments?.photo1,
        application.attachments?.resume,
    ].filter(Boolean);

    if (urls.length === 0) return;

    await Promise.allSettled(
        urls.map(url => {
            const key = getKeyFromUrl(url);
            return key ? deleteS3Object(key) : Promise.resolve();
        })
    );
};

// @desc    Get all job applications
// @route   GET /api/admin/job-applications
// @access  Private/Admin
export const getJobApplications = async (req, res) => {
    try {
        // You can filter by jobId if passed in query
        const filter = {};
        if (req.query.jobId) {
            filter.jobId = req.query.jobId;
        }

        const applications = await JobApplication.find(filter)
            .populate('jobId', 'title department slug')
            .sort({ createdAt: -1 });
            
        res.status(200).json({ success: true, data: applications });
    } catch (error) {
        console.error("Error fetching job applications:", error);
        res.status(500).json({ success: false, message: 'Server error fetching job applications' });
    }
};

// @desc    Get single job application
// @route   GET /api/admin/job-applications/:id
// @access  Private/Admin
export const getJobApplication = async (req, res) => {
    try {
        const application = await JobApplication.findById(req.params.id).populate('jobId');
        if (!application) {
            return res.status(404).json({ success: false, message: 'Job application not found' });
        }
        res.status(200).json({ success: true, data: application });
    } catch (error) {
        console.error("Error fetching job application:", error);
        res.status(500).json({ success: false, message: 'Server error fetching job application' });
    }
};

// @desc    Update application status
// @route   PUT /api/admin/job-applications/:id/status
// @access  Private/Admin
export const updateApplicationStatus = async (req, res) => {
    try {
        const { status } = req.body;
        
        if (!['Pending', 'Reviewed', 'Rejected', 'Hired'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        const application = await JobApplication.findByIdAndUpdate(
            req.params.id, 
            { status }, 
            { new: true, runValidators: true }
        ).populate('jobId', 'title');

        if (!application) {
            return res.status(404).json({ success: false, message: 'Job application not found' });
        }

        res.status(200).json({ success: true, data: application });
    } catch (error) {
        console.error("Error updating job application status:", error);
        res.status(500).json({ success: false, message: 'Server error updating job application status' });
    }
};

// @desc    Delete job application
// @route   DELETE /api/admin/job-applications/:id
// @access  Private/Admin
export const deleteJobApplication = async (req, res) => {
    try {
        const application = await JobApplication.findById(req.params.id);
        if (!application) {
            return res.status(404).json({ success: false, message: 'Job application not found' });
        }

        // Delete attached files from S3 (resume, photo, photo1) before removing the record
        await deleteApplicationFiles(application);

        await application.deleteOne();
        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        console.error("Error deleting job application:", error);
        res.status(500).json({ success: false, message: 'Server error deleting job application' });
    }
};

// @desc    Bulk delete job applications
// @route   POST /api/admin/job-applications/bulk-delete
// @access  Private/Admin
export const bulkDeleteJobApplications = async (req, res) => {
    try {
        const { ids } = req.body;
        
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ success: false, message: 'No application IDs provided' });
        }

        // Fetch all records first so we can collect their attachment URLs
        const applications = await JobApplication.find({ _id: { $in: ids } });

        // Delete all attached files from S3 concurrently (best-effort)
        await Promise.allSettled(applications.map(app => deleteApplicationFiles(app)));

        // Remove the DB records
        await JobApplication.deleteMany({ _id: { $in: ids } });

        res.status(200).json({ success: true, message: 'Job applications deleted successfully' });
    } catch (error) {
        console.error("Error bulk deleting job applications:", error);
        res.status(500).json({ success: false, message: 'Server error bulk deleting job applications' });
    }
};
