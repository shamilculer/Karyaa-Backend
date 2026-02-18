import Vendor from "../models/Vendor.model.js";
import Bundle from "../models/Bundle.model.js";
import { generateTokens } from "../utils/index.js";
import SubCategory from "../models/SubCategory.model.js";
import Category from "../models/Category.model.js";
import mongoose from "mongoose";
import { getCoordinatesFromAddress } from "../utils/fetchCordinates.js";
import GalleryItem from "../models/GalleryItem.model.js";
import bcrypt from "bcrypt";
import { sendEmail, prepareVendorData } from "../services/email.service.js";

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
    isInternational,
    // UAE-specific fields
    tradeLicenseNumber,
    tradeLicenseCopy,
    personalEmiratesIdNumber,
    emiratesIdCopy,
    // NEW: International-specific fields
    businessLicenseCopy,
    passportOrIdCopy,
    // Common business fields
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
    address,
    availability,
    websiteLink,
    facebookLink,
    instagramLink,
    twitterLink,
  } = req.body;

  try {
    // Check for existing vendor conflicts
    const conflictQuery = {
      $or: [
        { email },
        { phoneNumber }
      ]
    };

    // Only check tradeLicenseNumber if vendor is not international
    if (!isInternational && tradeLicenseNumber) {
      conflictQuery.$or.push({ tradeLicenseNumber });
    }

    const existingVendor = await Vendor.findOne(conflictQuery);

    if (existingVendor) {
      let message = "A vendor account already exists with the information provided.";

      if (existingVendor.email === email) {
        message = "The email address you entered is already registered. Please use a different email or log in.";
      } else if (existingVendor.phoneNumber === phoneNumber) {
        message = "The phone number you entered is already registered with another account.";
      } else if (!isInternational && existingVendor.tradeLicenseNumber === tradeLicenseNumber) {
        message = "The Trade License Number you entered is already registered with another account.";
      }

      return res.status(400).json({
        success: false,
        message: message,
      });
    }

    const selectedBundleDoc = await Bundle.findById(selectedBundle);

    if (!selectedBundleDoc) {
      return res.status(400).json({
        success: false,
        message: "The selected bundle does not exist.",
      });
    }

    if (selectedBundleDoc.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "The selected bundle is currently not available.",
      });
    }

    // Check if bundle has reached capacity
    if (selectedBundleDoc.hasReachedCapacity()) {
      return res.status(400).json({
        success: false,
        message: `The selected bundle has reached its maximum capacity. Please choose a different bundle.`,
      });
    }

    // Check if bundle is available for international vendors
    if (isInternational && !selectedBundleDoc.isAvailableForInternational) {
      return res.status(400).json({
        success: false,
        message: "The selected bundle is not available for international vendors.",
      });
    }

    // Coordinate fetching logic
    let coordinates = address?.coordinates;

    const finalAddress = {
      ...address,
      country: address?.country || (isInternational ? "" : "UAE"),
    };

    // Fetch coordinates if not provided
    if (!coordinates || (!coordinates.latitude && !coordinates.longitude)) {
      const fetchedCoords = await getCoordinatesFromAddress(finalAddress);

      if (fetchedCoords) {
        coordinates = fetchedCoords;
      } else {
        console.warn("Geocoding failed for the provided address.");
      }
    }

    finalAddress.coordinates = coordinates;

    // Create new vendor
    const newVendor = new Vendor({
      ownerName,
      ownerProfileImage,
      email,
      phoneNumber,
      password,
      isInternational: isInternational || false,

      // Conditionally set UAE fields
      tradeLicenseNumber: !isInternational ? tradeLicenseNumber : undefined,
      tradeLicenseCopy: !isInternational ? tradeLicenseCopy : undefined,
      personalEmiratesIdNumber: !isInternational ? personalEmiratesIdNumber : undefined,
      emiratesIdCopy: !isInternational ? emiratesIdCopy : undefined,

      // Conditionally set International fields
      businessLicenseCopy: isInternational ? businessLicenseCopy : undefined,
      passportOrIdCopy: isInternational ? passportOrIdCopy : undefined,

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
      address: finalAddress,
      availability,
      websiteLink,
      facebookLink,
      instagramLink,
      twitterLink,
    });

    // --- VALIDATE FILES EXIST BEFORE REGISTRATION ---
    // Check if all uploaded files still exist in S3 (in case they expired)
    const { checkS3ObjectExists, getKeyFromUrl } = await import("../utils/s3.js");
    const fileFieldsToCheck = [
      { field: 'businessLogo', value: businessLogo },
      { field: 'tradeLicenseCopy', value: tradeLicenseCopy },
      { field: 'emiratesIdCopy', value: emiratesIdCopy },
      { field: 'businessLicenseCopy', value: businessLicenseCopy },
      { field: 'passportOrIdCopy', value: passportOrIdCopy },
      { field: 'ownerProfileImage', value: ownerProfileImage }
    ];

    for (const { field, value } of fileFieldsToCheck) {
      // Extract URL from object if needed (handles both string URLs and {url, uploadedAt} objects)
      const url = typeof value === 'string' ? value : value?.url;

      if (url && url.includes('temp_vendors/')) {
        const key = getKeyFromUrl(url);
        if (key) {
          const exists = await checkS3ObjectExists(key);
          if (!exists) {
            return res.status(400).json({
              success: false,
              error: `Your uploaded file for "${field}" has expired or no longer exists. Please re-upload your documents and try again.`
            });
          }
        }
      }
    }

    await newVendor.save();

    // --- MOVE FILES TO PERMANENT FOLDER ---
    // Now that we have the slug, we can move files from temp_vendors/ to vendors/{slug}/
    try {
      const { moveS3Object, getKeyFromUrl } = await import("../utils/s3.js");
      const fileFields = [
        'businessLogo',
        'tradeLicenseCopy',
        'personalEmiratesIdNumber', // Wait, this is a number, not a file? Check schema.
        'emiratesIdCopy',
        'businessLicenseCopy',
        'passportOrIdCopy'
      ];

      // Note: personalEmiratesIdNumber is a string (number), not a file. 
      // tradeLicenseNumber is also a string.
      // The file fields are: businessLogo, tradeLicenseCopy, emiratesIdCopy, businessLicenseCopy, passportOrIdCopy.
      // Also ownerProfileImage if it was uploaded (but schema says it's generated if missing).

      const actualFileFields = [
        'businessLogo',
        'tradeLicenseCopy',
        'emiratesIdCopy',
        'businessLicenseCopy',
        'passportOrIdCopy',
        'ownerProfileImage'
      ];

      let hasUpdates = false;

      for (const field of actualFileFields) {
        const url = newVendor[field];
        if (url && typeof url === 'string' && url.includes('temp_vendors/')) {
          const oldKey = getKeyFromUrl(url);
          if (oldKey) {
            const fileName = oldKey.split('/').pop();
            const newKey = `vendors/${newVendor.slug}/documents/${fileName}`;

            try {
              const newUrl = await moveS3Object(oldKey, newKey);
              newVendor[field] = newUrl;
              hasUpdates = true;
            } catch (moveError) {
              console.error(`Failed to move file for field ${field}:`, moveError);
              // Continue even if one fails, or maybe flag it? 
              // For now, we log it. The file remains in temp.
            }
          }
        }
      }

      if (hasUpdates) {
        await newVendor.save();
      }

    } catch (err) {
      console.error("Error moving files to permanent storage:", err);
      // We don't fail the request if moving fails, but we should probably alert admin or log it.
    }

    // --- SEND EMAIL NOTIFICATIONS ---
    try {
      const vendorData = prepareVendorData(newVendor);

      // Send confirmation email to vendor
      await sendEmail({
        to: newVendor.email,
        template: 'vendor-registration',
        data: vendorData,
      });

      // Send alert email to vendor@ (recipientOverride in template config)
      await sendEmail({
        template: 'admin-vendor-alert',
        data: vendorData,
      });

      console.log('✅ Registration emails sent successfully');
    } catch (emailError) {
      // Log error but don't fail the registration
      console.error("Error sending registration emails:", emailError);
    }

    res.status(201).json({
      success: true,
      message:
        "Success! Your registration has been submitted and is now pending admin approval. We will notify you via email shortly.",
      vendor: {
        _id: newVendor._id,
        referenceId: newVendor.referenceId,
        businessName: newVendor.businessName,
        email: newVendor.email,
        vendorStatus: newVendor.vendorStatus,
        isInternational: newVendor.isInternational,
        slug: newVendor.slug, // Return slug too
      },
    });
  } catch (error) {
    console.error("Vendor registration error:", error);

    // Handle duplicate key errors (e.g., businessName)
    // Handle duplicate key errors (e.g., businessName)
    if (error.code === 11000) {
      if (error.keyPattern) {
        if (error.keyPattern.businessName) {
          return res.status(400).json({
            success: false,
            message: "A vendor with this business name already exists. Please choose a different name.",
          });
        }
        if (error.keyPattern.email) {
          return res.status(400).json({
            success: false,
            message: "The email address you entered is already registered. Please use a different email or log in.",
          });
        }
        if (error.keyPattern.phoneNumber) {
          return res.status(400).json({
            success: false,
            message: "The phone number you entered is already registered with another account.",
          });
        }
        if (error.keyPattern.tradeLicenseNumber) {
          return res.status(400).json({
            success: false,
            message: "The Trade License Number you entered is already registered with another account.",
          });
        }
      }

      // Fallback for generic duplicate error
      return res.status(400).json({
        success: false,
        message: "A duplicate record exists. Please check your information and try again.",
      });
    }

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

    if (vendor.vendorStatus !== "approved") {
      return res.status(403).json({
        success: false,
        message: `Account status is ${vendor.vendorStatus}. Please wait for admin approval.`,
      });
    }

    // TODO: replace this with 
    const isMatch = await bcrypt.compare(password, vendor.password);
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
      bundle: vendor.selectedBundle
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
    occasion,
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

  // ✅ LOCATION (UAE CITY or INTERNATIONAL)
  if (location) {
    if (location.toLowerCase() === "international") {
      filterClauses.push({ isInternational: true });
    } else {
      const locRegex = new RegExp(`${location}`, "i");
      filterClauses.push({
        $or: [
          { "address.city": locRegex },
          { "address.area": locRegex },
          { "address.street": locRegex },
        ]
      });
    }
  }

  // MAIN CATEGORY
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

  // SUB-CATEGORIES
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

  if (occasion && occasion !== "none" && occasion !== "all") {
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
      totalVendors = await Vendor.countDocuments(query);
      totalPages = Math.ceil(totalVendors / limit);
    }

    const vendors = await Vendor.find(query)
      .select(
        "businessName slug businessDescription businessLogo address.city averageRating  pricingStartingFrom  isRecommended tagline address.coordinates referenceId"
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
      const vendorIds = vendors.map((v) => v._id);

      const galleryItems = await GalleryItem.find({
        vendor: { $in: vendorIds },
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

      vendors.forEach((vendor) => {
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
    query.vendorStatus = "approved";

    const vendor = await Vendor.findOne(query)
      .select("-password -tradeLicenseCopy -tempUploadToken -__v -customFeatures -customDuration -subscriptionEndDate -subscriptionStartDate -selectedBundle -emiratesIdCopy -personalEmiratesIdNumber -tradeLicenseNumber")
      .populate("subCategories");

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found or is not currently approved.",
      });
    }

    const vendorData = vendor.toJSON();

    res.status(200).json({
      success: true,
      message: "Vendor fetched successfully.",
      data: vendorData,
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
    const { q, limit = 50 } = req.query; // Default limit to 50

    let filter = { vendorStatus: "approved" };
    if (q) {
      filter.businessName = { $regex: q, $options: 'i' };
    }

    const options = await Vendor.find(filter)
      .select("slug businessName businessLogo referenceId")
      .sort({ businessName: 1 })
      .limit(parseInt(limit)) // Apply limit
      .lean();

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

  if (!slugsQuery) {
    return res.status(200).json({ success: true, data: [] });
  }

  const slugs = [
    ...new Set(slugsQuery.split(",").filter((s) => s.trim() !== "")),
  ];
  try {
    // First, check if vendor exists at all (ignore status)
    const allVendors = await Vendor.find({
      slug: { $in: slugs },
    })
      .select("slug businessName vendorStatus")
      .lean();

    // Now get active ones
    const vendors = await Vendor.find({
      slug: { $in: slugs },
      vendorStatus: "approved",
    })
      .select({
        slug: 1,
        businessName: 1,
        businessLogo: 1,
        pricingStartingFrom: 1,
        averageRating: 1,
        occasionsServed: 1,
        "address.city": 1,
        "address.country": 1,
        mainCategory: 1,
        subCategories: 1,
        reviewCount: 1,
        _id: 1,
      })
      .populate({ path: "mainCategory", select: "name slug" })
      .populate({ path: "subCategories", select: "name slug" })
      .lean();

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

export const getVendorProfileForEdit = async (req, res) => {
  const vendorId = req.user.id;

  try {
    const vendor = await Vendor.findById(vendorId)
      .select("-password -__v -tempUploadToken -selectedBundle -subscriptionStartDate -subscriptionEndDate -customDuration -customFeatures -vendorStatus -role -isRecommended -isSponsored -ratingBreakdown -reviewCount -averageRating")
      .populate("mainCategory", "name slug")
      .populate("subCategories", "name slug");

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor profile not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Vendor profile data fetched for editing.",
      data: vendor,
    });
  } catch (error) {
    console.error(`Error fetching vendor profile for ID ${vendorId}:`, error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching vendor profile.",
    });
  }
};

export const updateVendor = async (req, res) => {
  const vendorId = req.user.id;

  const updateData = { ...req.body };

  if (updateData.password) {
    delete updateData.password;
    console.warn(`Attempted to update password via general update route for vendor ID: ${vendorId}. Action blocked.`);
  }

  delete updateData.vendorStatus;
  delete updateData.role;

  const isInternational = updateData.isInternational !== undefined ? updateData.isInternational : req.user.isInternational;

  if (isInternational) {
    updateData.tradeLicenseNumber = undefined;
    updateData.tradeLicenseCopy = undefined;
    updateData.personalEmiratesIdNumber = undefined;
    updateData.emiratesIdCopy = undefined;
  }

  try {
    let coordinates;
    let finalAddress = updateData.address;

    if (finalAddress) {
      coordinates = finalAddress.coordinates;

      finalAddress.country = finalAddress.country || (isInternational ? "" : "UAE");

      if (!coordinates || (!coordinates.latitude && !coordinates.longitude)) {
        const fetchedCoords = await getCoordinatesFromAddress(finalAddress);

        if (fetchedCoords) {
          coordinates = fetchedCoords;
        } else {
          console.warn(`Geocoding failed for the provided address for vendor ${vendorId}.`);
        }
      }

      finalAddress.coordinates = coordinates;
      updateData.address = finalAddress; // Update the main object with the new address structure
    }

    const updatedVendor = await Vendor.findByIdAndUpdate(
      vendorId,
      { $set: updateData },
      { new: true, runValidators: true }
    )
      .select("-password -__v -tempUploadToken")
      .populate("mainCategory", "name slug")
      .populate("subCategories", "name slug");

    if (!updatedVendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found.",
      });
    }

    // 5. Send success response
    res.status(200).json({
      success: true,
      message: "Vendor profile updated successfully.",
      data: updatedVendor,
    });

  } catch (error) {
    console.error(`Vendor update failed for ID ${vendorId}:`, error);

    // Handle Mongoose Validation Errors
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({
        success: false,
        message: `Validation Error: ${messages.join(", ")}`,
      });
    }

    // Handle other errors (e.g., Database/Server Errors)
    res.status(500).json({
      success: false,
      message: "System Error: Failed to update vendor profile.",
    });
  }
};

/**
 * @desc Update vendor password
 * @route PUT /api/v1/vendor/password
 * @access Private (Vendor)
 */
export const updateVendorPassword = async (req, res) => {
  const vendorId = req.user.id;
  const { currentPassword, newPassword } = req.body;

  try {
    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Both current password and new password are required.",
      });
    }

    // Validate new password strength
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters long.",
      });
    }

    // Fetch vendor with password field
    const vendor = await Vendor.findById(vendorId).select("+password");

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found.",
      });
    }

    // Verify current password
    const isMatch = bcrypt.compareSync(currentPassword, vendor.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect.",
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    vendor.password = hashedPassword;
    await vendor.save();

    res.status(200).json({
      success: true,
      message: "Password updated successfully.",
    });
  } catch (error) {
    console.error(`Password update failed for vendor ID ${vendorId}:`, error);
    res.status(500).json({
      success: false,
      message: "Server error while updating password.",
    });
  }
};
