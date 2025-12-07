import express from 'express';
import {
    sendTestEmail,
    sendCustomTestEmail,
    checkEmailConfig,
} from '../../controllers/test/email.test.controller.js';

const router = express.Router();

// Test email endpoints (remove these in production)
router.post('/send-email', sendTestEmail);
router.post('/send-custom-email', sendCustomTestEmail);
router.get('/email-config', checkEmailConfig);

export default router;
