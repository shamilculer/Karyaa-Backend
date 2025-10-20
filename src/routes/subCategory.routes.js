import{
    getSubcategories,
    createSubCategory,
    editSubCategory,
    deleteSubCategory,
    getSubCategory
} from "../controllers/subCategory.controller.js"
import express from "express"
import { verifyToken } from "../middleware/verifyToken.js"

const router = express.Router();

router.get('/', getSubcategories);
router.get('/:identifier', getSubCategory);
router.post('/create', verifyToken, createSubCategory);
router.put('/edit/:id', verifyToken, editSubCategory);
router.delete('/delete/:id', verifyToken, deleteSubCategory );


export default router