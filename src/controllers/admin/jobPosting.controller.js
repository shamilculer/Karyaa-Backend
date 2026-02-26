import JobPosting from '../../models/JobPosting.model.js';

// @desc    Get all job postings
// @route   GET /api/admin/job-postings
// @access  Private/Admin
export const getJobPostings = async (req, res) => {
    try {
        const jobs = await JobPosting.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: jobs });
    } catch (error) {
        console.error("Error fetching job postings:", error);
        res.status(500).json({ success: false, message: 'Server error fetching job postings' });
    }
};

// @desc    Get single job posting
// @route   GET /api/admin/job-postings/:id
// @access  Private/Admin
export const getJobPosting = async (req, res) => {
    try {
        const job = await JobPosting.findById(req.params.id);
        if (!job) {
            return res.status(404).json({ success: false, message: 'Job posting not found' });
        }
        res.status(200).json({ success: true, data: job });
    } catch (error) {
        console.error("Error fetching job posting:", error);
        res.status(500).json({ success: false, message: 'Server error fetching job posting' });
    }
};

// @desc    Create new job posting
// @route   POST /api/admin/job-postings
// @access  Private/Admin
export const createJobPosting = async (req, res) => {
    try {
        // Automatically generate slug from title
        if (req.body.title) {
            let baseSlug = req.body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            let tempSlug = baseSlug;
            let counter = 1;
            
            // Check for duplicates and append number if needed
            while (await JobPosting.findOne({ slug: tempSlug })) {
                tempSlug = `${baseSlug}-${counter}`;
                counter++;
            }
            req.body.slug = tempSlug;
        }

        // Generate unique jobId
        const lastJob = await JobPosting.findOne().sort({ createdAt: -1 });
        let sequenceNumber = 1;

        if (lastJob && lastJob.jobId && lastJob.jobId.startsWith('KARJOB-')) {
            const lastSeq = parseInt(lastJob.jobId.split('-')[1]);
            if (!isNaN(lastSeq)) {
                sequenceNumber = lastSeq + 1;
            }
        }
        req.body.jobId = `KARJOB-${sequenceNumber.toString().padStart(4, '0')}`;

        const jobPosting = await JobPosting.create(req.body);
        res.status(201).json({ success: true, data: jobPosting });
    } catch (error) {
        console.error("Error creating job posting:", error);
        res.status(500).json({ success: false, message: error.message || 'Server error creating job posting' });
    }
};

// @desc    Update job posting
// @route   PUT /api/admin/job-postings/:id
// @access  Private/Admin
export const updateJobPosting = async (req, res) => {
    try {
        let jobPosting = await JobPosting.findById(req.params.id);
        if (!jobPosting) {
            return res.status(404).json({ success: false, message: 'Job posting not found' });
        }

        // If slug is being updated, check for duplicates (though frontend shouldn't send it)
        if (req.body.slug && req.body.slug !== jobPosting.slug) {
            let baseSlug = req.body.slug;
            let tempSlug = baseSlug;
            let counter = 1;
            while (await JobPosting.findOne({ slug: tempSlug })) {
                tempSlug = `${baseSlug}-${counter}`;
                counter++;
            }
            req.body.slug = tempSlug;
        }

        jobPosting = await JobPosting.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({ success: true, data: jobPosting });
    } catch (error) {
        console.error("Error updating job posting:", error);
        res.status(500).json({ success: false, message: error.message || 'Server error updating job posting' });
    }
};

// @desc    Delete job posting
// @route   DELETE /api/admin/job-postings/:id
// @access  Private/Admin
export const deleteJobPosting = async (req, res) => {
    try {
        const jobPosting = await JobPosting.findById(req.params.id);
        if (!jobPosting) {
            return res.status(404).json({ success: false, message: 'Job posting not found' });
        }
        await jobPosting.deleteOne();
        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        console.error("Error deleting job posting:", error);
        res.status(500).json({ success: false, message: 'Server error deleting job posting' });
    }
};
