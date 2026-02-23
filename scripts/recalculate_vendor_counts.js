import 'dotenv/config';
import connectDB from '../src/config/db.js';
import Vendor from '../src/models/Vendor.model.js';
import Category from '../src/models/Category.model.js';
import SubCategory from '../src/models/SubCategory.model.js';

const main = async () => {
    try {
        await connectDB();

        console.log("🔄 Starting vendor count recalculation...");

        // Step 1: Reset all counts to 0
        console.log("📊 Resetting all category/subcategory counts to 0...");
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
            if (vendor.mainCategory && Array.isArray(vendor.mainCategory)) {
                for (const catId of vendor.mainCategory) {
                    const catIdStr = catId.toString();
                    categoryCounts[catIdStr] = (categoryCounts[catIdStr] || 0) + 1;
                }
            }
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

        // Step 6: Print summary
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

        console.log("\n--- Script Complete ---");
        console.log(`Total approved vendors: ${approvedVendors.length}`);
        console.log(`Categories updated:     ${categoryUpdates.length}`);
        console.log(`Subcategories updated:  ${subcategoryUpdates.length}`);

    } catch (error) {
        console.error("❌ Script error:", error);
    } finally {
        process.exit(0);
    }
};

main();
