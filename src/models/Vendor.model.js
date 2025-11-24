import mongoose from "mongoose";
import bcrypt from "bcrypt";

const vendorSchema = mongoose.Schema(
    {
        referenceId: {
            type: String,
            unique: true,
            trim: true,
        },
        ownerName: {
            type: String,
            required: [true, "Owner's Name is required for registration"],
            trim: true,
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            trim: true,
        },
        phoneNumber: {
            type: String,
            required: [true, "Phone Number is required for OTP verification"],
            unique: true,
            trim: true,
        },
        password: {
            type: String,
            required: [true, "Password is required"],
            minlength: 6,
        },
        ownerProfileImage: {
            type: String,
            trim: true,
        },
        isInternational: {
            type: Boolean,
            default: false,
            index: true,
        },
        // UAE-Specific Fields (Required if not international)
        tradeLicenseNumber: {
            type: String,
            required: function () {
                return !this.isInternational;
            },
            trim: true,
        },
        tradeLicenseCopy: {
            type: String,
            required: function () {
                return !this.isInternational;
            },
        },
        personalEmiratesIdNumber: {
            type: String,
            required: function () {
                return !this.isInternational;
            },
            trim: true,
        },
        emiratesIdCopy: {
            type: String,
            required: function () {
                return !this.isInternational;
            },
        },
        // International-Specific Fields (Required if international)
        businessLicenseCopy: {
            type: String,
            required: function () {
                return this.isInternational;
            },
        },
        passportOrIdCopy: {
            type: String,
            required: function () {
                return this.isInternational;
            },
        },
        
        // Additional Documents Section
        additionalDocuments: [
            {
                documentName: {
                    type: String,
                    required: true,
                    trim: true,
                },
                documentUrl: {
                    type: String,
                    required: true,
                    trim: true,
                },
                uploadedAt: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],

        // Admin Comments Section (Only admins can add/edit/delete)
        adminComments: [
            {
                message: {
                    type: String,
                    required: true,
                    trim: true,
                },
                createdAt: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],

        businessName: {
            type: String,
            required: [true, "Business Name is required for vendor listing"],
            unique: true,
            trim: true,
        },
        slug: {
            type: String,
            unique: true,
            lowercase: true,
            trim: true,
        },
        tagline: {
            type: String,
            trim: true,
            maxlength: 120,
            default: "",
        },
        businessLogo: {
            type: String,
            required: [true, "Business Logo is required for verification"],
            trim: true,
        },
        businessDescription: {
            type: String,
            required: [true, "Business description is required"],
            trim: true,
            minlength: 50,
            maxlength: 1500,
        },
        whatsAppNumber: {
            type: String,
            required: [true, "WhatsApp Number is required"],
            trim: true,
        },
        pricingStartingFrom: {
            type: Number,
            default: 0,
            min: 0,
        },

        mainCategory: {
            type: [mongoose.Schema.Types.ObjectId],
            ref: "Category",
            required: [true, "At least one Main Category is required"],
            validate: {
                validator: function (v) {
                    return v && v.length > 0;
                },
                message: "At least one Main Category is required.",
            },
        },

        subCategories: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "SubCategory",
            },
        ],

        occasionsServed: {
            type: [String],
            enum: [
              "wedding",
              "engagement",
              "proposal",
              "baby-shower",
              "gender-reveal",
              "birthday",
              "graduation",
              "corporate-event",
              "brand-launch",
              "festivities",
              "anniversary",
            ],
            default: [],
            index: true,
          },

        // Bundle & Subscription Fields
        selectedBundle: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Bundle",
            required: [true, "A bundle must be selected."],
        },

        subscriptionStartDate: {
            type: Date,
            default: null,
        },

        subscriptionEndDate: {
            type: Date,
            default: null,
        },

        // Custom duration - overrides bundle duration if set by admin
        customDuration: {
            value: {
                type: Number,
                min: 1,
            },
            unit: {
                type: String,
                enum: ["days", "months", "years"],
            },
            bonusPeriod: {
                value: {
                    type: Number,
                    default: 0,
                    min: 0,
                },
                unit: {
                    type: String,
                    enum: ["days", "months", "years"],
                },
            },
        },

        // Custom features added by admin (beyond bundle features)
        customFeatures: [
            {
                type: String,
                trim: true,
            },
        ],

        address: {
            street: {
                type: String,
                trim: true,
                default: "",
            },
            area: {
                type: String,
                trim: true,
                default: "",
            },
            city: {
                type: String,
                trim: true,
                required: [true, "City is required"],
            },
            state: {
                type: String,
                trim: true,
                default: "",
            },
            country: {
                type: String,
                trim: true,
                required: [true, "Country is required"],
            },
            zipCode: {
                type: String,
                trim: true,
                default: "",
            },
            coordinates: {
                latitude: { type: Number },
                longitude: { type: Number },
            },
            googleMapLink: {
                type: String,
                trim: true,
                default: "",
            },
        },

        websiteLink: {
            type: String,
            trim: true,
            default: "",
        },
        facebookLink: {
            type: String,
            trim: true,
            default: "",
        },
        instagramLink: {
            type: String,
            trim: true,
            default: "",
        },
        twitterLink: {
            type: String,
            trim: true,
            default: "",
        },
        averageRating: {
            type: Number,
            min: 0,
            max: 5,
            default: 0,
        },
        reviewCount: {
            type: Number,
            default: 0,
        },
        ratingBreakdown: {
            1: { type: Number, default: 0 },
            2: { type: Number, default: 0 },
            3: { type: Number, default: 0 },
            4: { type: Number, default: 0 },
            5: { type: Number, default: 0 },
        },
        isSponsored: {
            type: Boolean,
            default: false,
        },
        isRecommended: {
            type: Boolean,
            default: false,
            index: true,
        },
        vendorStatus: {
            type: String,
            enum: ["pending", "approved", "rejected", "expired"],
            default: "pending",
        },
        role: {
            type: String,
            enum: ["user", "vendor", "admin"],
            default: "vendor",
        },
    },
    {
        timestamps: true,
        toJSON: { getters: true, virtuals: true },
        toObject: { getters: true, virtuals: true }
    }
);

vendorSchema.virtual('formattedRating').get(function() {
    return parseFloat(this.averageRating || 0).toFixed(1);
});

vendorSchema.index(
    { tradeLicenseNumber: 1 },
    { unique: true, partialFilterExpression: { tradeLicenseNumber: { $ne: null } } }
);

/* ---------------------- HELPER FUNCTIONS ---------------------- */

/**
 * Helper: normalize array of ObjectIds to string ids (for comparison)
 */
function idsToStrings(arr) {
    if (!arr) return [];
    return arr.map((v) => String(v));
}

/**
 * Helper: atomic increments for categories / subcategories / bundles
 */
async function incCategoryCounts({ mainIds = [], subIds = [], bundleId = null, inc = 1 }) {
    const Category = mongoose.model("Category");
    const SubCategory = mongoose.model("SubCategory");
    const Bundle = mongoose.model("Bundle");

    const ops = [];
    if (mainIds && mainIds.length) {
        ops.push(Category.updateMany({ _id: { $in: mainIds } }, { $inc: { vendorCount: inc } }));
    }
    if (subIds && subIds.length) {
        ops.push(SubCategory.updateMany({ _id: { $in: subIds } }, { $inc: { vendorCount: inc } }));
    }
    if (bundleId) {
        ops.push(Bundle.findByIdAndUpdate(bundleId, { $inc: { subscribersCount: inc } }));
    }
    try {
        await Promise.all(ops);
    } catch (err) {
        console.error("Error updating category/subcategory/bundle counts:", err);
    }
}


async function adjustCountsForChange(prev = null, next = null) {
    const prevStatus = prev?.vendorStatus || null;
    const nextStatus = next?.vendorStatus || null;

    const prevMain = idsToStrings(prev?.mainCategory || []);
    const nextMain = idsToStrings(next?.mainCategory || []);

    const prevSub = idsToStrings(prev?.subCategories || []);
    const nextSub = idsToStrings(next?.subCategories || []);

    const prevBundle = prev?.selectedBundle ? String(prev.selectedBundle) : null;
    const nextBundle = next?.selectedBundle ? String(next.selectedBundle) : null;

    const becameApproved = prevStatus !== "approved" && nextStatus === "approved";
    const lostApproved = prevStatus === "approved" && (nextStatus === "pending" || nextStatus === "rejected");
    const becameExpired = prevStatus === "approved" && nextStatus === "expired";
    const stillApproved = prevStatus === "approved" && nextStatus === "approved";

    // 1) Status transition: non-approved -> approved
    if (becameApproved) {
        await incCategoryCounts({ mainIds: nextMain, subIds: nextSub, bundleId: nextBundle, inc: 1 });
        return;
    }

    // 2) Status transition: approved -> non-approved (pending/rejected)
    if (lostApproved) {
        await incCategoryCounts({ mainIds: prevMain, subIds: prevSub, bundleId: prevBundle, inc: -1 });
        return;
    }

    // 3) Status transition: approved -> expired
    if (becameExpired) {
        await incCategoryCounts({ mainIds: prevMain, subIds: prevSub, bundleId: prevBundle, inc: -1 });
        return;
    }

    // 4) Status unchanged and still approved => handle diffs for category arrays and bundle changes
    if (stillApproved) {
        // Main categories diffs
        const addedMain = nextMain.filter((id) => !prevMain.includes(id));
        const removedMain = prevMain.filter((id) => !nextMain.includes(id));

        if (addedMain.length) {
            await incCategoryCounts({ mainIds: addedMain, inc: 1 });
        }
        if (removedMain.length) {
            await incCategoryCounts({ mainIds: removedMain, inc: -1 });
        }

        // Subcategories diffs
        const addedSub = nextSub.filter((id) => !prevSub.includes(id));
        const removedSub = prevSub.filter((id) => !nextSub.includes(id));

        if (addedSub.length) {
            await incCategoryCounts({ subIds: addedSub, inc: 1 });
        }
        if (removedSub.length) {
            await incCategoryCounts({ subIds: removedSub, inc: -1 });
        }

        // Bundle change (if any)
        if (prevBundle && nextBundle && prevBundle !== nextBundle) {
            await incCategoryCounts({ bundleId: prevBundle, inc: -1 });
            await incCategoryCounts({ bundleId: nextBundle, inc: 1 });
        } else if (!prevBundle && nextBundle) {
            await incCategoryCounts({ bundleId: nextBundle, inc: 1 });
        } else if (prevBundle && !nextBundle) {
            await incCategoryCounts({ bundleId: prevBundle, inc: -1 });
        }

        return;
    }

    // 5) Status unchanged and NOT approved -> no count changes needed
}

/* ---------------------- PRE-SAVE HOOK (COMBINED) ---------------------- */

vendorSchema.pre("save", async function (next) {
    try {
        // 1. Capture previous state (for count tracking)
        if (!this.isNew) {
            const Vendor = mongoose.model("Vendor");
            const prev = await Vendor.findById(this._id).lean();
            this._previousVendorState = prev || null;
        } else {
            this._previousVendorState = null;
        }

        // 2. Reference ID Generation
        if (!this.referenceId && this.isNew) {
             const generateRefId = () => {
                const random = Math.floor(100000 + Math.random() * 900000); // 6 digit number
                return `KAR${random}`;
             };
             
             let refId = generateRefId();
             if (mongoose.models.Vendor) {
                while (await mongoose.models.Vendor.findOne({ referenceId: refId })) {
                    refId = generateRefId();
                }
             }
             this.referenceId = refId;
        }

        // 3. Slug Generation
        if (this.isModified("businessName") || this.isNew) {
            let baseSlug = this.businessName
                .toLowerCase()
                .replace(/&/g, "and")
                .replace(/\s+/g, "-")
                .replace(/[^a-z0-9-]/g, "");

            let slug = baseSlug;
            let count = 1;

            if (mongoose.models.Vendor) {
                while (
                    await mongoose.models.Vendor.findOne({ slug, _id: { $ne: this._id } })
                ) {
                    slug = `${baseSlug}-${count++}`;
                }
            }
            this.slug = slug;
        }

        // 3. Dynamic Owner Profile Image Generation
        if (!this.ownerProfileImage && this.ownerName) {
            const formattedName = encodeURIComponent(this.ownerName.trim());
            this.ownerProfileImage = `https://ui-avatars.com/api/?background=random&color=fff&name=${formattedName}`;
        }

        // 4. Password hashing
        if (this.isModified("password")) {
            const salt = await bcrypt.genSalt(10);
            this.password = await bcrypt.hash(this.password, salt);
        }

        next();
    } catch (err) {
        next(err);
    }
});

/* ---------------------- POST-SAVE HOOK ---------------------- */

vendorSchema.post("save", async function (doc, next) {
    try {
        const prev = doc._previousVendorState || null;
        const nextDoc = await mongoose.model("Vendor").findById(doc._id).lean();
        await adjustCountsForChange(prev, nextDoc);
    } catch (err) {
        console.error("Error in post-save adjustCountsForChange:", err);
    }
    if (typeof next === "function") next();
});

/* ---------------------- QUERY-BASED UPDATE HOOKS ---------------------- */

vendorSchema.pre("findOneAndUpdate", async function (next) {
    try {
        const query = this.getQuery();
        const prev = await this.model.findOne(query).lean();
        this._previousVendorState = prev || null;
    } catch (err) {
        console.error("Error fetching previous vendor state in pre-findOneAndUpdate:", err);
        this._previousVendorState = null;
    }
    next();
});

vendorSchema.post("findOneAndUpdate", async function (res, next) {
    try {
        const prev = this._previousVendorState || null;
        const query = this.getQuery();
        const current = await this.model.findOne(query).lean();
        if (current) {
            await adjustCountsForChange(prev, current);
        }
    } catch (err) {
        console.error("Error in post-findOneAndUpdate adjustCountsForChange:", err);
    }
    if (typeof next === "function") next();
});

/* ---------------------- DELETION HOOKS ---------------------- */

// For document.deleteOne()
vendorSchema.pre("deleteOne", { document: true, query: false }, async function (next) {
    try {
        if (this.vendorStatus === "approved") {
            const mainIds = idsToStrings(this.mainCategory || []);
            const subIds = idsToStrings(this.subCategories || []);
            const bundleId = this.selectedBundle ? String(this.selectedBundle) : null;

            await incCategoryCounts({ mainIds, subIds, bundleId, inc: -1 });
        }
    } catch (err) {
        console.error("Error decrementing counts on vendor deletion:", err);
    }
    next();
});

// For Model.findOneAndDelete() or Model.findByIdAndDelete()
vendorSchema.pre("findOneAndDelete", async function (next) {
    try {
        const query = this.getQuery();
        const vendor = await this.model.findOne(query).lean();

        if (vendor && vendor.vendorStatus === "approved") {
            const mainIds = idsToStrings(vendor.mainCategory || []);
            const subIds = idsToStrings(vendor.subCategories || []);
            const bundleId = vendor.selectedBundle ? String(vendor.selectedBundle) : null;

            await incCategoryCounts({ mainIds, subIds, bundleId, inc: -1 });
        }
    } catch (err) {
        console.error("Error decrementing counts on vendor deletion:", err);
    }
    next();
});

/* ---------------------- INSTANCE METHODS ---------------------- */

// Check if subscription is currently active
vendorSchema.methods.hasActiveSubscription = function () {
    return (
        this.vendorStatus === "approved" &&
        this.subscriptionEndDate &&
        new Date() <= this.subscriptionEndDate
    );
};

// Get total subscription duration (base + bonus)
vendorSchema.methods.getTotalSubscriptionDuration = async function () {
    // If custom duration is set, use that
    if (this.customDuration && this.customDuration.value) {
        const baseDuration = {
            value: this.customDuration.value,
            unit: this.customDuration.unit,
        };

        const bonusDuration =
            this.customDuration.bonusPeriod && this.customDuration.bonusPeriod.value
                ? {
                    value: this.customDuration.bonusPeriod.value,
                    unit: this.customDuration.bonusPeriod.unit,
                }
                : null;

        return { base: baseDuration, bonus: bonusDuration };
    }

    // Otherwise, use bundle duration
    if (!this.selectedBundle) return null;

    const Bundle = mongoose.model("Bundle");
    const bundle = await Bundle.findById(this.selectedBundle).select(
        "duration bonusPeriod"
    );

    if (!bundle) return null;

    const baseDuration = {
        value: bundle.duration.value,
        unit: bundle.duration.unit,
    };

    const bonusDuration =
        bundle.bonusPeriod && bundle.bonusPeriod.value
            ? {
                value: bundle.bonusPeriod.value,
                unit: bundle.bonusPeriod.unit,
            }
            : null;

    return { base: baseDuration, bonus: bonusDuration };
};

// Get all features (bundle + custom)
vendorSchema.methods.getAllFeatures = async function () {
    if (!this.selectedBundle) return this.customFeatures || [];

    const Bundle = mongoose.model("Bundle");
    const bundle = await Bundle.findById(this.selectedBundle).select("features");

    if (!bundle) return this.customFeatures || [];

    return [...(bundle.features || []), ...(this.customFeatures || [])];
};



const Vendor = mongoose.model("Vendor", vendorSchema);

export default Vendor;