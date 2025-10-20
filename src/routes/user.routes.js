import express from 'express';
import {
    createUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    fetchUserSession,
    getSavedVendors,
    toggleSavedVendor
} from "../controllers/user.controller.js"
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router()

router.post('/auth/create', createUser);
router.post('/auth/login', loginUser);
router.post('/auth/logout', logoutUser);
router.post('/auth/refresh', refreshAccessToken);
router.get('/auth/session', verifyToken, fetchUserSession);
router.get('/saved-vendors', verifyToken, getSavedVendors);
router.patch('/saved-vendors/toggle', verifyToken, toggleSavedVendor);

export default router