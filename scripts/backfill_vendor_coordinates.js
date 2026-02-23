import 'dotenv/config';
import connectDB from '../src/config/db.js';
import Vendor from '../src/models/Vendor.model.js';
import { getCoordinatesFromAddress } from '../src/utils/fetchCordinates.js';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const main = async () => {
    try {
        await connectDB();

        // Find ALL vendors where coordinates are missing
        console.log("Fetching vendors with missing coordinates...");
        const vendors = await Vendor.find({
            $or: [
                { "address.coordinates": { $exists: false } },
                { "address.coordinates.latitude": { $exists: false } },
                { "address.coordinates.latitude": null },
            ]
        }).select("businessName isInternational address");

        console.log(`Found ${vendors.length} vendors without coordinates.`);
        console.log(`  - Domestic: ${vendors.filter(v => !v.isInternational).length}`);
        console.log(`  - International: ${vendors.filter(v => v.isInternational).length}\n`);

        let updatedCount = 0;
        let failedCount = 0;

        for (const vendor of vendors) {
            const type = vendor.isInternational ? "🌍 International" : "🇦🇪 Domestic";
            console.log(`\nProcessing ${type}: ${vendor.businessName} (${vendor._id})`);

            if (!vendor.address || !vendor.address.city) {
                console.log('  Skipping: No city in address.');
                failedCount++;
                continue;
            }

            // For domestic vendors, ensure country is set
            const addressToGeocode = {
                ...vendor.address.toObject(),
                country: vendor.address.country || (vendor.isInternational ? '' : 'UAE'),
            };

            console.log(`  Address: ${[addressToGeocode.area, addressToGeocode.city, addressToGeocode.country].filter(Boolean).join(', ')}`);

            const coordinates = await getCoordinatesFromAddress(addressToGeocode);

            if (coordinates) {
                console.log(`  ✅ Coordinates: ${coordinates.latitude}, ${coordinates.longitude}`);
                await Vendor.updateOne(
                    { _id: vendor._id },
                    { $set: { "address.coordinates": coordinates } }
                );
                updatedCount++;
            } else {
                console.log('  ❌ Failed to fetch coordinates.');
                failedCount++;
            }

            // Respect OpenCage rate limit (1 req/sec on free tier)
            await delay(1100);
        }

        console.log(`\n--- Script Complete ---`);
        console.log(`Total updated:       ${updatedCount}`);
        console.log(`Total failed/skipped: ${failedCount}`);

    } catch (error) {
        console.error("Script error:", error);
    } finally {
        process.exit(0);
    }
};

main();
