// NOTE: This script assumes you are using Mongoose and have a Vendor model imported.
import Vendor from "../models/Vendor.model.js";

export async function seed() {
    // --- 1. HARDCODED VENDOR ID ---
    // Replace with the ID of the vendor you want to modify (e.g., '65f57345672d689e4c5f3e2c')
    const VENDOR_ID = "68f4c61bd9f2d27070d38eee"; 

    // --- 2. HARDCODED GALLERY DATA ---
    // This is the new array that will *completely replace* the vendor's existing gallery.
    const newGalleryArray = [
        { 
            url: 'https://res.cloudinary.com/dlcrywuub/image/upload/v1760872230/cover-1_yrmycm.jpg', 
            type: 'image' 
        },
        { 
            url: 'https://res.cloudinary.com/dlcrywuub/image/upload/v1760872230/cover-5_albebb.jpg', 
            type: 'image' 
        },
        { 
            url: 'https://res.cloudinary.com/dlcrywuub/image/upload/v1760872230/cover-6_awirel.jpg', 
            type: 'image' 
        },
        { 
            url: 'https://res.cloudinary.com/dlcrywuub/image/upload/v1760872231/cover-8_klcrbc.jpg', 
            type: 'image' 
        },
        { 
            url: 'https://res.cloudinary.com/dlcrywuub/image/upload/v1760872230/cover-2_jgygan.jpg', 
            type: 'image' 
        },
        { 
            url: 'https://res.cloudinary.com/dlcrywuub/image/upload/v1760872231/cover-12_zdhaio.jpg', 
            type: 'image' 
        },
    ];
    // ----------------------------------------
    
    try {
        const updatedVendor = await Vendor.findByIdAndUpdate(
            VENDOR_ID,
            {
                // $set replaces the entire 'gallery' field with the new array
                $set: { gallery: newGalleryArray },
            },
            { 
                new: true, // Returns the updated document
                runValidators: true // Ensures the new data adheres to the Zod/Mongoose schema
            }
        );

        if (!updatedVendor) {
            console.error(`Error: Vendor with ID ${VENDOR_ID} not found.`);
            return null;
        }

        console.log(`✅ Gallery array successfully replaced for vendor ID: ${VENDOR_ID}`);
        console.log("New Gallery Count:", updatedVendor.gallery.length);
        return updatedVendor;

    } catch (error) {
        console.error(`❌ Failed to update gallery for vendor ${VENDOR_ID}:`, error);
        throw error;
    }
}

// Example Execution (Call this function with the vendor's ID):
// replaceVendorGallery('65f57345672d689e4c5f3e2c')
//     .catch(err => console.error(err));