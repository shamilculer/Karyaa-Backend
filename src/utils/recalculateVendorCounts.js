import mongoose from "mongoose";
import Vendor from "../models/Vendor.model.js";
import Category from "../models/Category.model.js";
import SubCategory from "../models/SubCategory.model.js";

/**
 * Migration Script: Recalculate vendorCount for all categories and subcategories
 * 
 * This script:
 * 1. Resets all vendorCount fields to 0
 * 2. Counts approved vendors for each category/subcategory
 * 3. Updates the counts in the database
 * 
 * Run this script once to fix existing data issues.
 */

async function recalculateVendorCounts() {
    try {
        console.log("🔄 Starting vendor count recalculation...");

        // Step 1: Reset all counts to 0
        console.log("📊 Resetting all category counts to 0...");
        await Category.updateMany({}, { $set: { vendorCount: 0 } });
        await SubCategory.updateMany({}, { $set: { vendorCount: 0 } });

        // Step 2: Get all approved vendors
        console.log("🔍 Fetching all approved vendors...");
        const approvedVendors = await Vendor.find({ vendorStatus: "approved" })
            .select("mainCategory subCategories businessName")
            .lean();

        console.log(`✅ Found ${approvedVendors.length} approved vendors`);

        // Step 3: Count vendors per category and subcategory
        const categoryCounts = {};
        const subcategoryCounts = {};

        for (const vendor of approvedVendors) {
            // Count main categories
            if (vendor.mainCategory && Array.isArray(vendor.mainCategory)) {
                for (const catId of vendor.mainCategory) {
                    const catIdStr = catId.toString();
                    categoryCounts[catIdStr] = (categoryCounts[catIdStr] || 0) + 1;
                }
            }

            // Count subcategories
            if (vendor.subCategories && Array.isArray(vendor.subCategories)) {
                for (const subId of vendor.subCategories) {
                    const subIdStr = subId.toString();
                    subcategoryCounts[subIdStr] = (subcategoryCounts[subIdStr] || 0) + 1;
                }
            }
        }

        // Step 4: Update category counts
        console.log("📝 Updating category counts...");
        const categoryUpdates = Object.entries(categoryCounts).map(([catId, count]) =>
            Category.findByIdAndUpdate(catId, { $set: { vendorCount: count } })
        );
        await Promise.all(categoryUpdates);
        console.log(`✅ Updated ${categoryUpdates.length} categories`);

        // Step 5: Update subcategory counts
        console.log("📝 Updating subcategory counts...");
        const subcategoryUpdates = Object.entries(subcategoryCounts).map(([subId, count]) =>
            SubCategory.findByIdAndUpdate(subId, { $set: { vendorCount: count } })
        );
        await Promise.all(subcategoryUpdates);
        console.log(`✅ Updated ${subcategoryUpdates.length} subcategories`);

        // Step 6: Display summary
        console.log("\n📊 Summary:");
        console.log("=".repeat(50));

        const categories = await Category.find().select("name vendorCount").lean();
        console.log("\n📁 Categories:");
        categories.forEach(cat => {
            console.log(`  - ${cat.name}: ${cat.vendorCount} vendors`);
        });

        const subcategories = await SubCategory.find()
            .populate("mainCategory", "name")
            .select("name vendorCount")
            .lean();
        console.log("\n📂 Subcategories:");
        subcategories.forEach(sub => {
            console.log(`  - ${sub.name} (${sub.mainCategory?.name}): ${sub.vendorCount} vendors`);
        });

        console.log("\n✅ Vendor count recalculation completed successfully!");
        console.log("=".repeat(50));

        return {
            success: true,
            totalApprovedVendors: approvedVendors.length,
            categoriesUpdated: categoryUpdates.length,
            subcategoriesUpdated: subcategoryUpdates.length,
        };
    } catch (error) {
        console.error("❌ Error recalculating vendor counts:", error);
        throw error;
    }
}

export default recalculateVendorCounts;
