import express from "express";
import { createAdmin, deleteAdmin, getAllAdmins, loginAdmin, toggleAdminStatus, updateAdminAccessControl } from "../../controllers/admin/admin.controller.js";
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
import { updateBrandDetails } from "../../controllers/admin/brandDetails.controller.js";
import { verifyToken } from "../../middleware/verifyToken.js";
import { deleteTicket, getAllSupportTickets, updateTicketStatus } from "../../controllers/admin/tickets.controller.js";
import {
  getAllBundles,
  createBundle,
  updateBundle,
  deleteBundle,
  toggleBundleStatus
} from "../../controllers/admin/bundle.controller.js"
import { createIdea, createIdeaCategory, deleteIdea, updateIdea, updateIdeaCategory } from "../../controllers/admin/idea.controller.js";
import {
  getAllVendors,
  getVendorById,
  toggleRecommended,
  updateVendorDocuments,
  updateVendorDuration,
  updateVendorFeatures,
  updateVendorStatus
} from "../../controllers/admin/vendor.controller.js";
import { createBanner, deleteBanner, getAllBanners, toggleStatus, updateBanner } from "../../controllers/admin/adBanner.controller.js";
import { deleteReferrals, getReferrals, updateReferralStatus } from "../../controllers/referral.controller.js";
import { bulkUpdateContent, deleteContent, getAllContent,getContentByKey,getLandingPageStructure,upsertContent } from "../../controllers/admin/pages.controller.js";

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
router.put("/ideas/category/:id/update", verifyToken, updateIdeaCategory)
router.post("/ideas/category/new", verifyToken, createIdeaCategory)


router.get("/vendors/all", verifyToken, getAllVendors);
router.get("/vendors/:id", verifyToken, getVendorById)
router.put("/vendors/:id/status", verifyToken, updateVendorStatus);
router.put("/vendors/:id/features", verifyToken, updateVendorFeatures)
router.put("/vendors/:id/toggle-recommendation", verifyToken, toggleRecommended)
router.patch("/vendors/:id/duration", verifyToken, updateVendorDuration);
router.patch("/vendors/:id/documents", verifyToken, updateVendorDocuments);

router.get("/ad-banner/all", verifyToken, getAllBanners);
router.put("/ad-banner/:id", verifyToken, updateBanner);
router.put("/ad-banner/:id/status", verifyToken, toggleStatus)
router.delete("/ad-banner/:id/delete", verifyToken, deleteBanner)
router.post("/ad-banner/new", createBanner);

router.get("/admins/all", verifyToken, getAllAdmins)
router.post("/admins/new", verifyToken, createAdmin)
router.put("/admins/:id/status", verifyToken, toggleAdminStatus)
router.delete("/admins/:id/delete", verifyToken, deleteAdmin);
router.put("/admins/:id/access-control", verifyToken, updateAdminAccessControl)

router.get("/referrals", verifyToken, getReferrals)
router.patch("/referrals/status", verifyToken, updateReferralStatus)
router.delete("/referrals/delete", verifyToken, deleteReferrals);

// Admin routes
router.get("/content", verifyToken, getAllContent);
router.get("/content/landing-page/structure", verifyToken, getLandingPageStructure);
router.get("/content/:key", verifyToken, getContentByKey);
router.put("/content/bulk-update", verifyToken, bulkUpdateContent);
router.put("/content/:key", verifyToken, upsertContent);
router.delete("/content/:key", verifyToken, deleteContent);


export default router;
