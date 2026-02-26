import express from 'express';
const router = express.Router();
import {
    getActiveJobs,
    getJobBySlug,
    submitApplication
} from '../../controllers/public/job.controller.js';

router.route('/')
    .get(getActiveJobs);

router.route('/:slug')
    .get(getJobBySlug);

router.route('/:id/apply')
    .post(submitApplication);

export default router;
