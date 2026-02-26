import JobPosting from '../../models/JobPosting.model.js';
import JobApplication from '../../models/JobApplication.model.js';
import { sendEmail } from '../../services/email.service.js';

// @desc    Get all active job postings
// @route   GET /api/public/jobs
// @access  Public
export const getActiveJobs = async (req, res) => {
    try {
        const jobs = await JobPosting.find({ isActive: true }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: jobs });
    } catch (error) {
        console.error("Error fetching active jobs:", error);
        res.status(500).json({ success: false, message: 'Server error fetching active jobs' });
    }
};

// @desc    Get single active job posting by slug
// @route   GET /api/public/jobs/:slug
// @access  Public
export const getJobBySlug = async (req, res) => {
    try {
        const job = await JobPosting.findOne({ slug: req.params.slug, isActive: true });
        if (!job) {
            return res.status(404).json({ success: false, message: 'Job not found' });
        }
        res.status(200).json({ success: true, data: job });
    } catch (error) {
        console.error("Error fetching job by slug:", error);
        res.status(500).json({ success: false, message: 'Server error fetching job details' });
    }
};

// @desc    Submit a job application
// @route   POST /api/public/jobs/:id/apply
// @access  Public
export const submitApplication = async (req, res) => {
    try {
        const { id } = req.params;
        const job = await JobPosting.findById(id);

        if (!job || !job.isActive) {
            return res.status(404).json({ success: false, message: 'Job posting not found or no longer active' });
        }

        const appData = req.body;
        appData.jobId = id;

        const application = await JobApplication.create(appData);

        // Respond immediately — emails fire in background
        res.status(201).json({
            success: true,
            message: 'Application submitted successfully',
            data: application._id
        });

        // Prepare shared email data
        const adminPanelUrl = `${process.env.ADMIN_PANEL_URL || 'https://karyaa.ae/admin'}/careers/job-applications`;
        const emailData = {
            firstName: application.basicInfo?.firstName || 'Applicant',
            lastName: application.basicInfo?.lastName || '',
            email: application.basicInfo?.email,
            mobile: application.basicInfo?.mobile,
            gender: application.basicInfo?.gender,
            dateOfBirth: application.basicInfo?.dateOfBirth
                ? new Date(application.basicInfo.dateOfBirth).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                : null,
            nationality: application.basicInfo?.nationality,
            currentCity: application.addressInfo?.currentCity,
            country: application.addressInfo?.country,
            currentJobTitle: application.professionalDetails?.currentJobTitle,
            currentEmployer: application.professionalDetails?.currentEmployer,
            availableToStart: application.professionalDetails?.availableToStart,
            linkedin: application.socialNetwork?.linkedin,
            jobTitle: job.title,
            applicationId: application.applicationId || application._id.toString(),
            adminPanelUrl,
        };

        // Fire both emails in parallel (non-blocking)
        Promise.all([
            // 1. Confirmation to applicant
            emailData.email
                ? sendEmail({ to: emailData.email, template: 'career-application-confirmation', data: emailData })
                : Promise.resolve(),
            // 2. Full details alert to careers team
            sendEmail({ template: 'admin-career-application-alert', data: emailData }),
        ]).catch((err) => console.error('Career application email error:', err));

    } catch (error) {
        console.error("Error submitting job application:", error);
        res.status(500).json({ success: false, message: error.message || 'Server error submitting job application' });
    }
};

