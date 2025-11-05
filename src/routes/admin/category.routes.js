import express from "express";
import { loginAdmin } from "../../controllers/admin/admin.controller.js";
import { 
    getCategories,
    getCategoryById
 } from "../../controllers/admin/category.controller.js";

const router = express.Router();

router.post("/auth/login", loginAdmin);


router.get("/manage-categories", getCategories);
router.get("/manage-categories/:id", getCategoryById);

export default router;