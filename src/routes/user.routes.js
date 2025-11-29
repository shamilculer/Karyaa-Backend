import express from 'express';
import {
    createUser,
    loginUser,
    logoutUser,
    fetchUserSession
} from "../controllers/user/auth.controller.js";
import {
    getSavedVendors,
    toggleSavedVendor
} from "../controllers/user/savedVendors.controller.js";
import {
    getUserProfile,
    updateUserProfile,
    changePassword,
    deleteUserAccount
} from "../controllers/user/profile.controller.js";
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router()

router.post('/auth/create', createUser);
router.post('/auth/login', loginUser);
router.post('/auth/logout', logoutUser);
router.get('/auth/session', verifyToken, fetchUserSession);
router.get('/saved-vendors', verifyToken, getSavedVendors);
router.patch('/saved-vendors/toggle', verifyToken, toggleSavedVendor);
router.get("/profile", verifyToken, getUserProfile);
router.patch("/profile", verifyToken, updateUserProfile);
router.patch("/profile/change-password", verifyToken, changePassword);
router.delete("/profile", verifyToken, deleteUserAccount);

export default router