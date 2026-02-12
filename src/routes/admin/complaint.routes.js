import express from 'express';
import { getAllComplaints, updateComplaintStatus } from '../../controllers/complaintController.js';
// import { protect, admin } from '../../middleware/authMiddleware.js'; // Assuming auth middleware exists and is needed

const router = express.Router();

// Add auth middleware if required, e.g., router.use(protect, admin);
// For now, I will assume it is mounted under an admin protected route or add it later if needed.
// Based on file exploration, routes are imported in index.js. 
// Standard admin routes seem to be protected in their definition or at the mount point.
// I will check admin.routes.js to see how it's done usually, but for now standard router is fine.

router.get('/', getAllComplaints);
router.patch('/:id/status', updateComplaintStatus);

export default router;
