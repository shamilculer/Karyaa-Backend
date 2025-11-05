import express from 'express';
import {
    createTicket
} from "../controllers/ticket.controller.js";
import { verifyVendor } from '../middleware/verifyVendor.js';

const router = express.Router();

router.post('/', verifyVendor, createTicket);

export default router;