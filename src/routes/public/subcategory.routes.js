import {
    getSubcategories,
    getSubCategory
} from "../../controllers/public/subcategory.controller.js"

import express from "express"

const router = express.Router();

router.get('/', getSubcategories);
router.get('/:identifier', getSubCategory);

export default router