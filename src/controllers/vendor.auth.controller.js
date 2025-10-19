import Vendor from "../models/Vendor.model.js";
import { generateTokens } from "../utils/index.js";
import bcrypt from "bcrypt";

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

// -------------------------------------------------------------------
// --- Get Active Vendors (GET /api/vendors/active) ---
// -------------------------------------------------------------------

/**
 * @desc Get a list of all active Vendors with optional pagination and filtering.
 * @route GET /api/vendors/active
 * @access Public
 * @query page, limit, search, mainCategory, subCategory, minPrice, maxPrice, city
 */
export const getActiveVendors = async (req, res) => {
    // 1. Pagination Parameters (Limit is now OPTIONAL)
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    // Determine if this is a standard paginated request or a simple limited list request.
    // If 'page' is explicitly set to 1 and 'limit' is used, we proceed with pagination logic.
    // However, if the query just wants a list (e.g., ?limit=5), we still use the limit/skip.
    const skip = (page - 1) * limit;

    // 2. Search/Filter Parameters from query
    const { 
        search, 
        mainCategory, 
        subCategory, 
        minPrice, 
        maxPrice,      
        city
    } = req.query;

    // 3. Base Query Filter: Only 'Active' vendors
    let query = { vendorStatus: "Active" };

    // 4. Add Search and Filtering Logic (kept same as previous robust version)
    
    // 4.1. Text Search 
    if (search) {
        const searchRegex = new RegExp(search, "i");
        query.$or = [
            { businessName: { $regex: searchRegex } },
            { "address.city": { $regex: searchRegex } },
            { mainCategory: { $in: [searchRegex] } }, 
        ];
    }

    // 4.2. Category Filtering 
    if (mainCategory) {
        query.mainCategory = { $in: [mainCategory] }; 
    }

    if (subCategory) {
        query.subCategories = { $in: [subCategory] }; 
    }

    // 4.3. Price Range Filtering
    const priceFilter = {};

    if (minPrice && !isNaN(parseFloat(minPrice))) {
        priceFilter.$gte = parseFloat(minPrice);
    }

    if (maxPrice && !isNaN(parseFloat(maxPrice))) {
        priceFilter.$lte = parseFloat(maxPrice);
    }

    if (Object.keys(priceFilter).length > 0) {
        query.pricingStartingFrom = priceFilter;
    }

    // 4.4. Location Filtering 
    if (city) {
        query["address.city"] = new RegExp(`^${city}$`, 'i'); 
    }

    try {
        // 5. Fetch paginated/limited data
        const vendors = await Vendor.find(query)
            .select("-password -tradeLicenseCopy -tempUploadToken -__v")
            .populate("mainCategory", "name slug") 
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });

        // 6. Check if pagination metadata is required. 
        // We assume pagination is NOT required if 'page' is not provided OR if the 
        // request is clearly asking for a small, simple list (e.g., limit < 10).
        // The most accurate way is to check if 'page' was defined in the query.
        
        // Use a flag to determine if we need the full count and metadata
        const needsPagination = req.query.page !== undefined;
        
        if (!needsPagination) {
             // 7a. Simple List Response (No pagination metadata)
             return res.status(200).json({
                success: true,
                message: `Limited list of ${vendors.length} active vendors fetched.`,
                data: vendors,
                // Do not include the 'pagination' object
            });
        }


        // 7b. Full Pagination Response (If 'page' was present in the query)

        // Total count for pagination metadata
        const totalVendors = await Vendor.countDocuments(query);
        const totalPages = Math.ceil(totalVendors / limit);

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