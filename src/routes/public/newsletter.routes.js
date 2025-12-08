import express from 'express';
import { subscribeToNewsletter } from '../../controllers/public/newsletter.controller.js';

const router = express.Router();

// POST /api/newsletter/subscribe - Subscribe to newsletter
router.post('/subscribe', subscribeToNewsletter);

export default router;
