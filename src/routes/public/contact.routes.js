import express from 'express';
import { submitContactForm } from '../../controllers/public/contact.controller.js';

const router = express.Router();

// POST /api/contact/new - Submit contact form
router.post('/new', submitContactForm);

export default router;
