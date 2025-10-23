import Vendor from "../models/Vendor.model.js";
import { generateTokens } from "../utils/index.js";
import bcrypt from "bcrypt";
import SubCategory from "../models/SubCategory.model.js";
import Category from "../models/Category.model.js";

// -------------------------------------------------------------------
// --- Vendor Registration (POST /api/vendors/register) ---
// -------------------------------------------------------------------
/**
 * @desc Registers a new Vendor.
 * @route POST /api/vendors/register
 * @access Public
 */
export const registerVendor = async (req, res) => {
    // ... (Your existing registerVendor code here)
    const {
        ownerName,
        ownerProfileImage,
        email,
        phoneNumber,
        password,
        businessName,
        businessLogo,
        tagline,
        tradeLicenseNumber,
        tradeLicenseCopy,
        mainCategory,
        subCategories,
        yearsOfExperience,
        aboutDescription,
        address,
        serviceAreaCoverage,
        pricingStartingFrom,
        gallery,
        packages,
        socialMediaLinks,
    } = req.body;

    try {
        // 1. Check for existing vendor
        const existingVendor = await Vendor.findOne({
            $or: [{ email }, { tradeLicenseNumber }],
        });

        if (existingVendor) {
            let message =
                "A vendor account already exists with the information provided.";

            if (
                existingVendor.email === email &&
                existingVendor.tradeLicenseNumber === tradeLicenseNumber
            ) {
                // MOST SPECIFIC MESSAGE
                message =
                    "Your email and Trade License Number are both already registered with an existing vendor account.";
            } else if (existingVendor.email === email) {
                // SPECIFIC EMAIL CONFLICT
                message =
                    "The email address you entered is already registered. Please use a different email or log in.";
            } else if (existingVendor.tradeLicenseNumber === tradeLicenseNumber) {
                // SPECIFIC TRADE LICENSE CONFLICT
                message =
                    "The Trade License Number you entered is already registered with another account.";
            }

            return res.status(400).json({
                success: false,
                // Use the most relevant message for the toast
                message: message,
            });
        }

        // 2. Inject the fixed country value into the address object
        const finalAddress = {
            ...address,
            country: "United Arab Emirates",
        }; // 3. The Vendor model's pre('save') hook handles password hashing, slug, and default image.

        const newVendor = new Vendor({
            ownerName,
            ownerProfileImage,
            email,
            phoneNumber,
            password,
            businessName,
            businessLogo,
            tagline,
            tradeLicenseNumber,
            tradeLicenseCopy,
            mainCategory,
            subCategories,
            yearsOfExperience,

            aboutDescription,
            address: finalAddress,
            serviceAreaCoverage,
            pricingStartingFrom,
            gallery,
            packages,
            socialMediaLinks,
        });

        const vendor = await newVendor.save(); // 4. Respond with a clear success message

        res.status(201).json({
            success: true,
            message:
                "**Success!** Your registration has been submitted and is now pending admin approval. We will notify you via email shortly.",
            vendor: {
                _id: vendor._id,
                businessName: vendor.businessName,
                email: vendor.email,
                vendorStatus: vendor.vendorStatus,
            },
        });
    } catch (error) {
        console.error("Vendor registration failed:", error);
        if (error.name === "ValidationError") {
            const messages = Object.values(error.errors).map((val) => val.message);
            return res.status(400).json({
                success: false,
                // Join validation messages into a single, clearer string
                message: `**Validation Error:** Please correct the following issues: ${messages.join(
                    ", "
                )}`,
            });
        }
        res.status(500).json({
            success: false,
            message:
                "**System Error:** Registration failed due to a server issue. Please try again later.",
        });
    }
};

// -------------------------------------------------------------------
// --- Vendor Login (POST /api/vendors/login) ---
// -------------------------------------------------------------------
/**
 * @desc Authenticate Vendor & Get Token
 * @route POST /api/vendors/login
 * @access Public
 */
export const loginVendor = async (req, res) => {
    // ... (Your existing loginVendor code here)
    const { email, password } = req.body;

    try {
        const vendor = await Vendor.findOne({ email }).select("+password");

        if (!vendor) {
            return res
                .status(400)
                .json({ success: false, message: "Invalid credentials (email)." });
        }

        if (vendor.vendorStatus !== "Active") {
            return res.status(403).json({
                success: false,
                message: `Account status is ${vendor.vendorStatus}. Please wait for admin approval.`,
            });
        }

        const isMatch = await bcrypt.compare(password, vendor.password);
        if (!isMatch) {
            return res
                .status(400)
                .json({ success: false, message: "Invalid credentials (password)." });
        }

        const { accessToken, refreshToken } = generateTokens(vendor);

        const vendorResponse = vendor.toObject();
        delete vendorResponse.password;

        res.status(201).json({
            message: "Vendor registered successfully",
            user: vendorResponse,
            accessToken,
            refreshToken,
        });
    } catch (error) {
        console.error("Vendor login failed:", error);
        res
            .status(500)
            .json({ success: false, message: "Server error during login." });
    }
};

// -------------------------
// @desc    Logout user
// @route   POST /api/vendor/auth/logout
// @access  Public
// -------------------------
export const logoutVendor = async (req, res) => {
    return res.status(200).json({ message: "Logged out successfully" });
};


/**
 * @desc Get a list of all active Vendors with optional pagination and filtering.
 * @route GET /api/vendors/active
 * @access Public
 * @query page, limit, search, mainCategory, subCategory, minPrice, maxPrice, city
 */
export const getActiveVendors = async (req, res) => {
    // ... (Your existing getActiveVendors code here)
    // 1. Pagination Parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 30;
    const skip = (page - 1) * limit;

    // 2. Search/Filter Parameters from query
    const { 
        search, 
        mainCategory,
        subCategory, 
        minPrice, 
        maxPrice, 
        location,
        serviceArea,
        hasPackages,
        isSponsored,
        rating,
        sort,
    } = req.query;

    let filterClauses = [{ vendorStatus: "Active" }];

    // ---------------------------------------------------
    // --- A. Search and Filtering Logic ---
    // ---------------------------------------------------

    // A.1. Text Search (Business Name, City)
    if (search) {
        const searchRegex = new RegExp(search, "i");
        filterClauses.push({
            $or: [
                { businessName: { $regex: searchRegex } },
                { "address.city": { $regex: searchRegex } },
            ],
        });
    }

    // A.2. Location Filtering (Exact City Match)
    if (location) {
        filterClauses.push({ "address.city": new RegExp(`^${location}$`, 'i') });
    }

    // A.3. Category Filtering (Main Category Slug)
    if (mainCategory) {
        try {
            // EFFICIENT TRANSLATION: Query MainCategory slug to get ObjectId.
            const mainCategoryDoc = await Category.findOne({ 
                slug: mainCategory 
            }).select('_id').lean();

            // Apply filter only if a matching ID was found.
            if (mainCategoryDoc) {
                // The vendor stores an array of mainCategory IDs, so we use $in
                filterClauses.push({ mainCategory: { $in: [mainCategoryDoc._id] } });
            } else {
                // If slug doesn't match any category, add a clause that returns no vendors
                filterClauses.push({ _id: null }); 
            }
        } catch (error) {
            console.error("Failed to translate MainCategory slug to ID:", error);
            // On error, silently skip the filter rather than crashing the request.
        }
    }

    // A.4. Sub Category Filtering (Sub Category Slugs)
    if (subCategory) {
        const subCategorySlugs = subCategory.split(',').filter(s => s.trim() !== '');

        if (subCategorySlugs.length > 0) {
            try {
                // EFFICIENT TRANSLATION: Query SubCategory slugs to get ObjectIds.
                const subCategoryDocs = await SubCategory.find({ 
                    slug: { $in: subCategorySlugs } 
                }).select('_id').lean();

                const subCategoryIds = subCategoryDocs.map(doc => doc._id);

                // Apply filter only if matching IDs were found.
                if (subCategoryIds.length > 0) {
                    filterClauses.push({ subCategories: { $in: subCategoryIds } });
                }
            } catch (error) {
                console.error("Failed to translate SubCategory slugs to IDs:", error);
            }
        }
    }
    
    // A.5. Price Range Filtering
    const priceFilter = {};
    if (minPrice && !isNaN(parseFloat(minPrice))) {
        priceFilter.$gte = parseFloat(minPrice);
    }
    if (maxPrice && !isNaN(parseFloat(maxPrice))) {
        priceFilter.$lte = parseFloat(maxPrice);
    }
    if (Object.keys(priceFilter).length > 0) {
        filterClauses.push({ pricingStartingFrom: priceFilter });
    }

    // A.6. Service Area Filtering
    if (serviceArea) {
        filterClauses.push({ serviceAreaCoverage: new RegExp(serviceArea, 'i') });
    }

    // A.7. Has Packages Filtering
    if (hasPackages === "true") {
        // Checks if the 'packages' array is NOT empty
        filterClauses.push({ packages: { $not: { $size: 0 } } }); 
    }

    // A.8. Sponsored Filtering
    if (isSponsored === "true") {
        filterClauses.push({ isSponsored: true });
    }

    // A.9. Rating Filtering
    if (rating && !isNaN(parseFloat(rating))) {
        const minRating = parseFloat(rating);
        filterClauses.push({ averageRating: { $gte: minRating } });
    }

    // Combine all filters
    const query = { $and: filterClauses };


    // ---------------------------------------------------
    // --- B. Sorting Logic ---
    // ---------------------------------------------------
    let sortOptions = { createdAt: -1 }; // Default sort: Newest first

    if (sort) {
        switch (sort) {
            case "rating-high":
                sortOptions = { averageRating: -1 };
                break;
            case "rating-low":
                sortOptions = { averageRating: 1 };
                break;
            case "price-low":
                sortOptions = { pricingStartingFrom: 1 };
                break;
            case "price-high":
                sortOptions = { pricingStartingFrom: -1 };
                break;
        }
    }


    try {
        // C. Fetch Data
        const needsPagination = req.query.page !== undefined;
        let totalVendors = 0;
        let totalPages = 1;

        // 1. Get total count if pagination is required
        if (needsPagination) {
             totalVendors = await Vendor.countDocuments(query);
             totalPages = Math.ceil(totalVendors / limit);
        }

        // 2. Fetch paginated/limited data with optimized selection and population
        const vendors = await Vendor.find(query)
            .select("businessName slug aboutDescription businessLogo averageRating reviewCount pricingStartingFrom isSponsored address.city serviceAreaCoverage gallery") 
            .populate("mainCategory", "name slug") 
            .sort(sortOptions)
            .skip(skip)
            .limit(limit)
            .lean(); 

        // D. Construct Response
        if (!needsPagination) {
            // Simple List Response
            return res.status(200).json({
                success: true,
                message: `Limited list of ${vendors.length} active vendors fetched.`,
                data: vendors,
            });
        }

        // Full Pagination Response
        return res.status(200).json({
            success: true,
            message: "Active vendors fetched successfully.",
            data: vendors,
            pagination: {
                totalVendors,
                totalPages,
                currentPage: page,
                limit,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
            },
        });
    } catch (error) {
        console.error("Error fetching active vendors:", error);
        res.status(500).json({
            success: false,
            message: "Server error while fetching vendors.",
        });
    }
};

/**
 * @desc Get a single active Vendor by ID or Slug
 * @route GET /api/vendors/:identifier
 * @access Public
 */
export const getSingleVendor = async (req, res) => {
    // ... (Your existing getSingleVendor code here)
    const identifier = req.params.identifier; // This can be the slug or the MongoDB ID

    try {
        // Build the query: try to match by slug or by MongoDB ID
        const query = {};
        
        // 1. Check if the identifier looks like a MongoDB ID (24 hex characters)
        if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
            query.$or = [{ slug: identifier }, { _id: identifier }];
        } else {
            // 2. Assume it's a slug if it doesn't look like an ID
            query.slug = identifier;
        }

        // Add the required status filter
        query.vendorStatus = "Active";

        const vendor = await Vendor.findOne(query)
            .select("-password -tradeLicenseCopy -tempUploadToken -__v")
            .populate("subCategories");

        if (!vendor) {
            return res.status(404).json({
                success: false,
                message: "Vendor not found or is not currently active.",
            });
        }

        res.status(200).json({
            success: true,
            message: "Vendor fetched successfully.",
            data: vendor,
        });
    } catch (error) {
        console.error("Error fetching single vendor:", error);
        res.status(500).json({
            success: false,
            message: "Server error while fetching the vendor.",
        });
    }
};

/**
 * @desc Get minimal data for all active vendors (for Combobox options)
 * @route GET /api/v1/vendor/options
 * @access Public
 */
export const getVendorOptions = async (req, res) => {
    try {
        const options = await Vendor.find({ vendorStatus: "Active" })
            .select("slug businessName")
            .sort({ businessName: 1 }) // Sort alphabetically for better UX
            .lean(); // Faster retrieval

        return res.status(200).json({ success: true, data: options });
    } catch (error) {
        console.error("Error fetching vendor options:", error);
        return res.status(500).json({ 
            success: false, 
            message: "Server error while fetching vendor options." 
        });
    }
};


/**
 * @desc Get full details for a list of vendors by their slugs (for CompareTable initial load)
 * @route GET /api/v1/vendor/compare
 * @access Public
 * @query slugs - comma-separated list of vendor slugs (e.g., ?slugs=slug1,slug2)
 */
export const getVendorsForComparison = async (req, res) => {
    const slugsQuery = req.query.slugs;

    console.log('📥 Received slugs query:', slugsQuery);
    console.log('📥 Query params:', req.query);

    if (!slugsQuery) {
        return res.status(200).json({ success: true, data: [] });
    }
    
    const slugs = [...new Set(slugsQuery.split(',').filter(s => s.trim() !== ''))];
    
    console.log('📋 Parsed slugs array:', slugs);

    try {
        // First, check if vendor exists at all (ignore status)
        const allVendors = await Vendor.find({ 
            slug: { $in: slugs }
        }).select('slug businessName vendorStatus').lean();
        
        console.log('🔍 Found ALL vendors (any status):', allVendors);

        // Now get active ones
        const vendors = await Vendor.find({ 
            slug: { $in: slugs },
            vendorStatus: "Active"
        })
        .select({
            slug: 1,
            businessName: 1,
            businessLogo: 1, 
            pricingStartingFrom: 1,
            averageRating: 1,
            isSponsored: 1, 
            'address.city': 1,
            'address.country': 1,
            mainCategory: 1,
            serviceAreaCoverage: 1,
            reviewCount: 1,
            gallery: 1,
            _id: 1
        })
        .populate({ path: 'mainCategory', select: 'name slug' }) 
        .lean();

        console.log('✅ Found ACTIVE vendors:', vendors);

        const orderedVendors = slugs
            .map(slug => vendors.find(v => v.slug === slug))
            .filter(v => v);
        
        return res.status(200).json({ success: true, data: orderedVendors });
    } catch (error) {
        console.error("❌ Error fetching vendors:", error);
        return res.status(500).json({ 
            success: false, 
            message: "Server error while fetching comparison data.",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};