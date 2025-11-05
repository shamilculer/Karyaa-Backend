import Idea from "../models/Idea.model.js";
import IdeaCategory from "../models/IdeaCategory.model.js";


const DUMMY_IMAGE_URLS = [
  "https://res.cloudinary.com/dlcrywuub/image/upload/v1762260925/ideas/gallery/ivbkxp32tywl7gz3dsja.webp",
  "https://res.cloudinary.com/dlcrywuub/image/upload/v1762260925/ideas/gallery/iep7s0b9qcupp8voozlf.webp",
  "https://res.cloudinary.com/dlcrywuub/image/upload/v1762260765/ideas/gallery/a4djzdpncxiur3hw7eaw.jpg",
  "https://res.cloudinary.com/dlcrywuub/image/upload/v1762260743/ideas/gallery/oi9pr3ujwr81c4yisvqj.jpg",
  "https://res.cloudinary.com/dlcrywuub/image/upload/v1762090709/temp_vendors/6b5d9c85-1c07-4f69-8227-61eebe30ef6d/bxgqdrictv30xm6l04qm.webp",
];

const dummyIdeas = [
  {
    title: "Tropical Luxe Wedding Proposal",
    description:
      "An extravagant, private beach proposal with a floral arch, professional lighting, and a private chef. Focused on Engagement & Proposal Events.",
    categoryName: "Engagement & Proposal Events",
    gallery: DUMMY_IMAGE_URLS,
  },
  {
    title: "Vintage Tea Party Baby Shower",
    description:
      "A charming, vintage-themed tea party held outdoors, featuring pastel colors and custom-made miniature sandwiches. Ideal for a Gender Reveal.",
    categoryName: "Baby Showers & Gender Reveals",
    gallery: DUMMY_IMAGE_URLS,
  },
  {
    title: "Art Deco 30th Birthday Bash",
    description:
      "A stylish 30th birthday party with an Art Deco theme, black and gold decor, and a dedicated photo booth area.",
    categoryName: "Birthdays & Anniversaries",
    gallery: DUMMY_IMAGE_URLS,
  },
  {
    title: "Sustainable Product Launch",
    description:
      "A zero-waste product launch held in a minimalist, green space to highlight the new eco-friendly product line. Focused on brand alignment.",
    categoryName: "Product Launches & Brand Events",
    gallery: DUMMY_IMAGE_URLS,
  },
];

/**
 * Creates dummy Idea documents using insertMany.
 * @throws {Error} If categories are missing or insertion fails.
 */
export const seed = async () => {
  console.log("--- Starting Ideas dummy data creation ---");

  try {
    // Essential check to ensure the categories are available
    const categories = await IdeaCategory.find({}, "name");
    if (categories.length === 0) {
      console.error(
        "❌ FATAL: Idea Categories NOT FOUND. Please run category seeder first."
      );
      return [];
    }

    const categoryMap = categories.reduce((map, cat) => {
      map[cat.name] = cat._id;
      return map;
    }, {}); // --- 1. Prepare Valid Idea Documents ---

    const ideaDocuments = dummyIdeas
      .map((item) => {
        const categoryId = categoryMap[item.categoryName];

        if (!categoryId) {
          console.warn(
            `⚠️ Skipping idea: Category '${item.categoryName}' not found in the database.`
          );
          return null;
        }

        return {
          title: item.title,
          description: item.description,
          category: categoryId,
          gallery: item.gallery,
          // NOTE: submittedBy is omitted to use schema default (null),
          // bypassing potential foreign key errors.
        };
      })
      .filter((doc) => doc !== null);

    if (ideaDocuments.length === 0) {
      console.log("No valid idea documents to insert.");
      return [];
    } // --- 2. Create the new Idea documents ---

    // Using Promise.all(Idea.create) for robust, individual error handling
    // in case one document fails validation.
    const creationPromises = ideaDocuments.map((doc) => {
      // Mongoose's create method will run the pre('save') hook for slug generation.
      return Idea.create(doc).catch((err) => {
        // Log and return null for failed documents to allow others to succeed
        console.error(`❌ Failed to create idea "${doc.title}":`, err.message);
        return null;
      });
    });

    const results = await Promise.all(creationPromises);
    const successfulInserts = results.filter((r) => r !== null);

    console.log(
      `✅ Ideas dummy data creation completed. ${successfulInserts.length} new ideas added.`
    );

    return successfulInserts;
  } catch (error) {
    console.error("❌ Error during Ideas dummy data creation:", error); // For the calling function to handle the error
    throw new Error(`Failed to create dummy Ideas: ${error.message}`);
  }
};
