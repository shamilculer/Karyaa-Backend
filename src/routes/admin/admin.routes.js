import express from "express";
import { loginAdmin } from "../../controllers/admin/admin.controller.js";
import {
  addCategory,
  addSubCategory,
  deleteCategory,
  deleteSubCategories,
  editSubCategory,
  getCategories,
  getCategoryById,
  toggleSubcategoryFlags,
  updateCategory,
} from "../../controllers/admin/category.controller.js";
import {
  addBlogPost,
  deleteBlogs,
  editBlogPost,
  getAllBlogs,
  getBlogPost,
  toggleBlogStatus,
} from "../../controllers/admin/adminBlog.controller.js";
import { getBrandDetails, updateBrandDetails } from "../../controllers/admin/brandDetails.controller.js";
import { verifyToken } from "../../middleware/verifyToken.js";
import { deleteTicket, getAllSupportTickets, updateTicketStatus } from "../../controllers/admin/tickets.controller.js";
import {
  getAllBundles,
  createBundle,
  updateBundle,
  deleteBundle,
  toggleBundleStatus
} from "../../controllers/admin/bundle.controller.js"
import { createIdea, deleteIdea, updateIdea } from "../../controllers/admin/idea.controller.js";
import { activateVendorSubscription, getAllVendors, getVendorById, toggleRecommended, updateVendorFeatures, updateVendorStatus } from "../../controllers/admin/vendor.controller.js";

const router = express.Router();

router.post("/auth/login", loginAdmin);

router.get("/manage-categories", getCategories);
router.get("/manage-categories/:id", getCategoryById);
router.post("/manage-categories/new", verifyToken, addCategory);
router.put("/manage-categories/:id", verifyToken, updateCategory);
router.delete("/manage-categories/:id", verifyToken, deleteCategory);

router.post("/manage-categories/subcategory/new", verifyToken, addSubCategory);
router.put("/manage-categories/subcategory/:id", verifyToken, editSubCategory);
router.delete("/manage-categories/subcategory/delete", verifyToken, deleteSubCategories);
router.patch("/manage-categories/subcategory/toggle-flag", verifyToken, toggleSubcategoryFlags);


router.post("/blog/new", verifyToken, addBlogPost)
router.put("/blog/edit/:id", verifyToken, editBlogPost)
router.get("/blog/all", verifyToken, getAllBlogs);
router.get("/blog/:slugOrId", verifyToken, getBlogPost);
router.delete("/blog/delete", verifyToken, deleteBlogs);
router.patch("/blog/toggle-status", verifyToken, toggleBlogStatus);

router.get("/brand-details", getBrandDetails);
router.put("/brand-details", updateBrandDetails);


router.get("/tickets/all", verifyToken, getAllSupportTickets);
router.put("/tickets/:id/status", verifyToken, updateTicketStatus);
router.delete("/tickets/:id", verifyToken, deleteTicket)


router.get("/bundles/all", verifyToken, getAllBundles)
router.post("/bundles/new", verifyToken, createBundle)
router.put("/bundles/:id", verifyToken, updateBundle)
router.put("/bundles/:id/status", verifyToken, toggleBundleStatus)
router.delete("/bundles/delete/:id", verifyToken, deleteBundle)


router.post("/ideas/new", verifyToken, createIdea)
router.put("/ideas/:id", verifyToken, updateIdea)
router.delete("/ideas/delete/:id", verifyToken, deleteIdea);


router.get("/vendors/all", verifyToken, getAllVendors);
router.get("/vendors/:id", verifyToken, getVendorById)
router.put("/vendors/:id/status", verifyToken, updateVendorStatus);
router.put("/vendors/:id/subscription", verifyToken, activateVendorSubscription)
router.put("/vendors/:id/features", verifyToken, updateVendorFeatures)
router.put("/vendors/:id/toggle-recommendation", verifyToken, toggleRecommended)

export default router;
