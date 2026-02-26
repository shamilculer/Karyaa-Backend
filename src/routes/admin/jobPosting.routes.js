import express from 'express';
const router = express.Router();
import {
    getJobPostings,
    getJobPosting,
    createJobPosting,
    updateJobPosting,
    deleteJobPosting
} from '../../controllers/admin/jobPosting.controller.js';
import { verifyAdmin } from '../../middleware/verifyAdmin.js';

// Protect all routes and restrict to admin
router.use(verifyAdmin);

router.route('/')
    .get(getJobPostings)
    .post(createJobPosting);

router.route('/:id')
    .get(getJobPosting)
    .put(updateJobPosting)
    .delete(deleteJobPosting);

export default router;
