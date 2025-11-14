import Package from "../models/Package.model.js";
import Vendor from "../models/Vendor.model.js";

export const createPackage = async (req, res) => {
    try {
        const vendorId = req.user?.id;

        if (!vendorId) {
            return res.status(401).json({ message: "Unauthorized vendor request" });
        }

        const {
            coverImage,
            services, // This is now an array of custom strings
            name,
            subheading,
            description,
            includes,
            priceStartingFrom,
        } = req.body;


        if (!coverImage) console.log(coverImage)
        if (!services) console.log(services?.length)
        if (!name) console.log(name)
          if (!description) console.log(description)
            if (!priceStartingFrom) console.log("price:", priceStartingFrom)

        // Required field check (Updated to be cleaner)
        if (
            !coverImage ||
            !services?.length ||
            !name ||
            !description ||
            priceStartingFrom === undefined || priceStartingFrom === null
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Missing required fields: coverImage, services[], name, description, priceStartingFrom",
            });
        }

        const vendorExists = await Vendor.findById(vendorId);
        if (!vendorExists) {
            return res.status(404).json({
                success: false,
                message: "Vendor not found",
            });
        }

        const packageCount = await Package.countDocuments({ vendor: vendorId });
        if (packageCount >= 9) {
            return res.status(403).json({
                success: false,
                message: "Limit reached: Vendors can create maximum 9 packages",
            });
        }


        const duplicate = await Package.findOne({
            vendor: vendorId,
            name: name.trim(),
        });

        if (duplicate) {
            return res.status(409).json({
                success: false,
                message: "A package with this name already exists",
            });
        }

        // Create payload
        const newPackage = await Package.create({
            vendor: vendorId,
            coverImage,
            services, // This is now an array of custom strings
            name,
            subheading,
            description,
            includes,
            priceStartingFrom,
        });

        return res.status(201).json({
            success: true,
            message: "Package created successfully",
            data: newPackage,
        });
    } catch (error) {
        console.error("Create Package Error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};


export const getVendorPackages = async (req, res) => {
    try {
        const vendorId = req.user?._id || req.params.vendorId;

        if (!vendorId) {
            return res.status(400).json({ message: "Vendor ID is required" });
        }

        const filter = {
            vendor: vendorId,
            isActive: true,
        };

        const packages = await Package.find(filter)
            .sort({ createdAt: -1 });

        return res.status(200).json({
            message: "Vendor packages fetched successfully",
            count: packages.length,
            data: packages,
        });
    } catch (error) {
        console.error("Get Vendor Packages Error:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message,
        });
    }
};

// -------------------------------------------------------------------

export const updatePackage = async (req, res) => {
    try {
        const {
            packageId,
            coverImage,
            services, // This is now an array of custom strings
            name,
            subheading,
            description,
            includes,
            priceStartingFrom,
        } = req.body;
        const vendorId = req.user?.id;

        if (!vendorId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized vendor request",
            });
        }

        if (!packageId) {
            return res.status(400).json({
                success: false,
                message: "Package ID is required",
            });
        }

        // Required fields validation
        if (
            !coverImage ||
            !services?.length ||
            !name ||
            !description ||
            priceStartingFrom === undefined || priceStartingFrom === null
        ) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: coverImage, services[], name, description, priceStartingFrom",
            });
        }

        const existingPackage = await Package.findById(packageId);

        if (!existingPackage) {
            return res.status(404).json({
                success: false,
                message: "Package not found",
            });
        }

        if (String(existingPackage.vendor) !== String(vendorId)) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized: You cannot update this package",
            });
        }

        const duplicate = await Package.findOne({
            vendor: vendorId,
            name: name.trim(),
            _id: { $ne: packageId },
        });

        if (duplicate) {
            return res.status(409).json({
                success: false,
                message: "A package with this name already exists",
            });
        }

        const updatedPackage = await Package.findByIdAndUpdate(
            packageId,
            {
                coverImage,
                services, // Now just an array of strings
                name: name.trim(),
                subheading,
                description,
                includes,
                priceStartingFrom,
            },
            { new: true, runValidators: true }
        )

        return res.status(200).json({
            success: true,
            message: "Package updated successfully",
            package: updatedPackage,
        });
    } catch (error) {
        console.error("Update Package Error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};


export const deletePackage = async (req, res) => {
    try {
        const { packageId } = req.body;
        const vendorId = req.user?.id;

        if (!packageId) {
            return res.status(400).json({
                success: false,
                message: "Package ID is required",
            });
        }

        // Fetch package
        const foundPackage = await Package.findById(packageId);

        if (!foundPackage) {
            return res.status(404).json({
                success: false,
                message: "Package not found",
            });
        }

        // Ownership check
        if (String(foundPackage.vendor) !== String(vendorId)) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized: You cannot delete this package",
            });
        }

        // Hard delete
        await Package.deleteOne({ _id: packageId });

        return res.status(200).json({
            success: true,
            message: "Package deleted successfully",
        });
    } catch (error) {
        console.error("Delete Package Error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};