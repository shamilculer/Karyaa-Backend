import Vendor from "../models/Vendor.model.js";
import { generateTokens } from "../utils/index.js";
import SubCategory from "../models/SubCategory.model.js";
import Category from "../models/Category.model.js";
import mongoose from "mongoose";
import { getCoordinatesFromAddress } from "../utils/fetchCordinates.js";
import GalleryItem from "../models/GalleryItem.model.js";

// -------------------------------------------------------------------
// --- Vendor Registration (POST /api/vendors/register) ---
// -------------------------------------------------------------------
/**
 * @desc Registers a new Vendor.
 * @route POST /api/vendors/register
 * @access Public
 */
export const registerVendor = async (req, res) => {
  const {
    ownerName,
    ownerProfileImage,
    email,
    phoneNumber,
    password,
    tradeLicenseNumber,
    tradeLicenseCopy,
    personalEmiratesIdNumber,
    emiratesIdCopy,
    businessName,
    businessLogo,
    tagline,
    businessDescription,
    whatsAppNumber,
    pricingStartingFrom,
    mainCategory,
    subCategories,
    occasionsServed, 
    selectedBundle,
    address, // Contains the structured address fields
    websiteLink,
    facebookLink,
    instagramLink,
    twitterLink,
  } = req.body;

  try {
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
        message: message,
      });
    }

    // --- ⭐️ NEW COORDINATE FETCHING LOGIC ---
    let coordinates = address?.coordinates;

    // 1. Prepare the final address object with the fixed country
    const finalAddress = {
      ...address,
      country: "UAE", // Set the fixed country value
    };

    // 2. Fetch coordinates using the structured address fields
    // Only fetch if coordinates were not explicitly provided or if they are empty
    if (!coordinates || (!coordinates.latitude && !coordinates.longitude)) {
      // Pass the final address object to the utility function
      // NOTE: getCoordinatesFromAddress function must be imported or defined
      const fetchedCoords = await getCoordinatesFromAddress(finalAddress); 

      if (fetchedCoords) {
        coordinates = fetchedCoords;
      } else {
        console.warn("Geocoding failed for the provided address.");
      }
    }

    // 3. Assign the fetched (or original) coordinates back to the final address object
    finalAddress.coordinates = coordinates;
    // --- END COORDINATE LOGIC ---

    const newVendor = new Vendor({
      ownerName,
      ownerProfileImage,
      email,
      phoneNumber,
      password,
      tradeLicenseNumber,
      tradeLicenseCopy,
      personalEmiratesIdNumber,
      emiratesIdCopy,
      businessName,
      businessLogo,
      tagline,
      businessDescription,
      whatsAppNumber,
      pricingStartingFrom,
      mainCategory,
      subCategories,
      // ⭐️ NEW FIELD INCLUDED HERE
      occasionsServed, 
      selectedBundle,
      address: finalAddress, // ⭐️ Updated with fetched coordinates

      //Social Links
      websiteLink,
      facebookLink,
      instagramLink,
      twitterLink,
    });

    const vendor = await newVendor.save();

    // 4. Respond with a clear success message
    res.status(201).json({
      success: true,
      message:
        "Success! Your registration has been submitted and is now pending admin approval. We will notify you via email shortly.",
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
        message: `Validation Error: Please correct the following issues: ${messages.join(
          ", "
        )}`,
      });
    }
    res.status(500).json({
      success: false,
      message:
        "System Error: Registration failed due to a server issue. Please try again later.",
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
  const { email, password } = req.body;

  try {
    const vendor = await Vendor.findOne({ email }).select("+password");

    if (!vendor) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Vendor with this email address does not exist.",
        });
    }

    if (vendor.vendorStatus !== "Active") {
      return res.status(403).json({
        success: false,
        message: `Account status is ${vendor.vendorStatus}. Please wait for admin approval.`,
      });
    }

    // TODO: replace this with bcrypt.compare(password, vendor.password)
    const isMatch = password === vendor.password;
    if (!isMatch) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials (password)." });
    }

    const { accessToken, refreshToken } = generateTokens(vendor);

    // ✅ Construct minimal vendor payload
    const vendorResponse = {
      id: vendor._id,
      businessName: vendor.businessName,
      businessLogo: vendor.businessLogo,
      role: vendor.role,
      email: vendor.emailAddress,
      slug: vendor.slug,
      tagline: vendor.tagline,
    };

    return res.status(200).json({
      success: true,
      message: "Vendor login successful.",
      vendor: vendorResponse,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error("Vendor login failed:", error);
    return res
      .status(500)
      .json({ success: false, message: "Server error during login." });
  }
};



export const getApprovedVendors = async (req, res) => {
    // 1. Pagination Setup
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 30;
    const skip = (page - 1) * limit;

    // 2. Destructure Query Parameters
    const {
        search,
        mainCategory,
        subCategory,
        minPrice,
        maxPrice,
        location,
        isSponsored,
        isRecommended,
        rating,
        sort,
        occasion, // <-- New Query Parameter
    } = req.query;

    let filterClauses = [{ vendorStatus: "approved" }];

    // ---------------------------------------------------
    // --- A. Search and Filtering Logic ---
    // ---------------------------------------------------

    // SEARCH
    if (search) {
        const searchRegex = new RegExp(search, "i");
        filterClauses.push({
            $or: [
                { businessName: { $regex: searchRegex } },
                { "address.city": { $regex: searchRegex } },
            ],
        });
    }

    // LOCATION
    if (location) {
        filterClauses.push({ "address.city": new RegExp(`^${location}$`, "i") });
    }

    // MAIN CATEGORY (Logic relies on Mongoose models being imported)
    if (mainCategory) {
        try {
            const mainCategoryDoc = await Category.findOne({ slug: mainCategory })
                .select("_id")
                .lean();

            if (mainCategoryDoc) {
                filterClauses.push({ mainCategory: { $in: [mainCategoryDoc._id] } });
            } else {
                filterClauses.push({ _id: null });
            }
        } catch (error) {
            console.error("Failed to translate MainCategory slug:", error);
        }
    }

    // SUB-CATEGORIES (Logic relies on Mongoose models being imported)
    if (subCategory) {
        const subSlugs = subCategory.split(",").filter(Boolean);
        if (subSlugs.length > 0) {
            try {
                const subDocs = await SubCategory.find({
                    slug: { $in: subSlugs },
                })
                    .select("_id")
                    .lean();

                const subIds = subDocs.map((d) => d._id);

                if (subIds.length > 0) {
                    filterClauses.push({ subCategories: { $in: subIds } });
                }
            } catch (error) {
                console.error("Failed to translate SubCategory slugs:", error);
            }
        }
    }

    // PRICE FILTER
    const priceFilter = {};
    if (minPrice && !isNaN(minPrice)) priceFilter.$gte = parseFloat(minPrice);
    if (maxPrice && !isNaN(maxPrice)) priceFilter.$lte = parseFloat(maxPrice);
    if (Object.keys(priceFilter).length > 0) {
        filterClauses.push({ pricingStartingFrom: priceFilter });
    }

    // SPONSORED
    if (isSponsored === "true") {
        filterClauses.push({ isSponsored: true });
    }

    // RECOMMENDED
    if (isRecommended === "true") {
        filterClauses.push({ isRecommended: true });
    }

    // RATING
    if (rating && !isNaN(rating)) {
        filterClauses.push({ averageRating: { $gte: parseFloat(rating) } });
    }
    
    // 🌟 NEW: OCCASION FILTER
    if (occasion && occasion !== "none") {
        filterClauses.push({ occasionsServed: occasion });
    }

    const query = { $and: filterClauses };

    // ---------------------------------------------------
    // --- B. Sorting Logic ---
    // ---------------------------------------------------
    let sortOptions = { createdAt: -1 };

    if (sort) {
        switch (sort) {
            case "rating-high":
                sortOptions = { averageRating: -1, createdAt: -1 };
                break;
            case "rating-low":
                sortOptions = { averageRating: 1, createdAt: -1 };
                break;
            case "price-low":
                sortOptions = { pricingStartingFrom: 1, createdAt: -1 };
                break;
            case "price-high":
                sortOptions = { pricingStartingFrom: -1, createdAt: -1 };
                break;
        }
    }

    try {
        const needsPagination = req.query.page !== undefined;
        let totalVendors = 0;
        let totalPages = 1;

        if (needsPagination) {
            // Assuming 'Vendor' model is available
            totalVendors = await Vendor.countDocuments(query);
            totalPages = Math.ceil(totalVendors / limit);
        }

        const vendors = await Vendor.find(query)
            .select(
                "businessName slug businessDescription businessLogo averageRating reviewCount pricingStartingFrom isSponsored isRecommended address.city"
            )
            .populate("mainCategory", "name slug")
            .sort(sortOptions)
            .skip(skip)
            .limit(limit)
            .lean();

        // ---------------------------------------------------
        // --- C. Fetch and Attach Gallery Items ---
        // ---------------------------------------------------

        if (vendors.length > 0) {
            const vendorIds = vendors.map(v => v._id);

            // Assuming 'GalleryItem' model is available
            const galleryItems = await GalleryItem.find({
                vendor: { $in: vendorIds }
            })
            .select("url vendor isFeatured") 
            .sort({ orderIndex: 1, createdAt: -1 })
            .lean();

            const galleryMap = galleryItems.reduce((acc, item) => {
                const vendorId = item.vendor.toString();
                if (!acc[vendorId]) {
                    acc[vendorId] = [];
                }
                acc[vendorId].push({
                    url: item.url,
                    isFeatured: item.isFeatured,
                });
                return acc;
            }, {});
            
            vendors.forEach(vendor => {
                vendor.gallery = galleryMap[vendor._id.toString()] || [];
            });
        }

        // ---------------------------------------------------
        // --- D. Response Handling ---
        // ---------------------------------------------------

        if (!needsPagination) {
            return res.status(200).json({
                success: true,
                message: `Limited list of ${vendors.length} approved vendors fetched with gallery.`,
                data: vendors,
            });
        }

        return res.status(200).json({
            success: true,
            message: "Approved vendors fetched successfully with gallery.",
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
        console.error("Error fetching approved vendors:", error);
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
      message: "Server error while fetching vendor options.",
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

  console.log("📥 Received slugs query:", slugsQuery);
  console.log("📥 Query params:", req.query);

  if (!slugsQuery) {
    return res.status(200).json({ success: true, data: [] });
  }

  const slugs = [
    ...new Set(slugsQuery.split(",").filter((s) => s.trim() !== "")),
  ];

  console.log("📋 Parsed slugs array:", slugs);

  try {
    // First, check if vendor exists at all (ignore status)
    const allVendors = await Vendor.find({
      slug: { $in: slugs },
    })
      .select("slug businessName vendorStatus")
      .lean();

    console.log("🔍 Found ALL vendors (any status):", allVendors);

    // Now get active ones
    const vendors = await Vendor.find({
      slug: { $in: slugs },
      vendorStatus: "Active",
    })
      .select({
        slug: 1,
        businessName: 1,
        businessLogo: 1,
        pricingStartingFrom: 1,
        averageRating: 1,
        isSponsored: 1,
        "address.city": 1,
        "address.country": 1,
        mainCategory: 1,
        serviceAreaCoverage: 1,
        reviewCount: 1,
        gallery: 1,
        _id: 1,
      })
      .populate({ path: "mainCategory", select: "name slug" })
      .lean();

    console.log("✅ Found ACTIVE vendors:", vendors);

    const orderedVendors = slugs
      .map((slug) => vendors.find((v) => v.slug === slug))
      .filter((v) => v);

    return res.status(200).json({ success: true, data: orderedVendors });
  } catch (error) {
    console.error("❌ Error fetching vendors:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching comparison data.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};


/**
 * @desc Get review statistics for a vendor
 * @route GET /api/v1/vendor/review-stats/:vendorId
 * @access Public
 */
export const getVendorReviewStats = async (req, res) => {
  try {
    const { vendorId } = req.params;

    // ✅ Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(vendorId)) {
      return res.status(400).json({ message: "Invalid Vendor ID format." });
    }

    // ✅ Fetch only required review-related fields
    const vendor = await Vendor.findById(vendorId).select(
      "averageRating reviewCount ratingBreakdown"
    );

    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found." });
    }

    // ✅ Return stats
    return res.status(200).json({
      averageRating: vendor.averageRating,
      totalReviews: vendor.reviewCount,
      ratingBreakdown: vendor.ratingBreakdown,
      message: "Successfully fetched vendor review stats.",
    });
  } catch (error) {
    console.error("Error fetching vendor review stats:", error);
    return res.status(500).json({
      message: "Error fetching vendor review stats.",
    });
  }
};


// Get unique cities for filter
export const getVendorCities = async (req, res) => {
  try {
    const cities = await Vendor.distinct('address.city');
    
    res.status(200).json({
      success: true,
      data: cities.filter(city => city) // Remove null/empty values
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
