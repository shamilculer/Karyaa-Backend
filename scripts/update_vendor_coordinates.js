import 'dotenv/config';
import connectDB from '../src/config/db.js';
import Vendor from '../src/models/vendor.model.js';
import { getCoordinatesFromAddress } from '../src/utils/fetchCordinates.js';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const main = async () => {
    try {
        await connectDB();
        
        console.log("Fetching international vendors...");
        const vendors = await Vendor.find({ isInternational: true });
        
        console.log(`Found ${vendors.length} international vendors.`);
        
        let updatedCount = 0;
        let failedCount = 0;

        for (const vendor of vendors) {
            console.log(`\nProcessing vendor: ${vendor.businessName} (${vendor._id})`);
            
            if (!vendor.address || !vendor.address.country) {
                console.log('Skipping: No address or country specified.');
                failedCount++;
                continue;
            }

            console.log(`Current Address: ${vendor.address.city}, ${vendor.address.country}`);
            
            const coordinates = await getCoordinatesFromAddress(vendor.address);
            
            if (coordinates) {
                console.log(`New Coordinates: Lat ${coordinates.latitude}, Lng ${coordinates.longitude}`);
                
                // Only update if they differ (or just always update since we want to fix them)
                vendor.address.coordinates = coordinates;
                
                // Using updateOne to avoid triggering all the save hooks unless necessary,
                // but if we want hooks, we use save(). In this case, updateOne is safer and faster.
                await Vendor.updateOne(
                    { _id: vendor._id },
                    { $set: { "address.coordinates": coordinates } }
                );
                
                updatedCount++;
                console.log('Successfully updated coordinates.');
            } else {
                console.log('Failed to fetch new coordinates.');
                failedCount++;
            }
            
            // Wait 1 second between requests to respect OpenCage rate limits (1 req/sec on free tier)
            await delay(1000);
        }

        console.log(`\n--- Script Complete ---`);
        console.log(`Total updated: ${updatedCount}`);
        console.log(`Total failed/skipped: ${failedCount}`);
        
    } catch (error) {
        console.error("Script error:", error);
    } finally {
        process.exit(0);
    }
};

main();
