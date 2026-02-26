import express from 'express';
const router = express.Router();
import {
    getJobApplications,
    getJobApplication,
    updateApplicationStatus,
    deleteJobApplication,
    bulkDeleteJobApplications
} from '../../controllers/admin/jobApplication.controller.js';
import { verifyAdmin } from '../../middleware/verifyAdmin.js';

// Protect all routes and restrict to admin
router.use(verifyAdmin);

router.route('/')
    .get(getJobApplications);

router.route('/bulk-delete')
    .post(bulkDeleteJobApplications);

router.route('/:id')
    .get(getJobApplication)
    .delete(deleteJobApplication);

router.route('/:id/status')
    .put(updateApplicationStatus);

export default router;
