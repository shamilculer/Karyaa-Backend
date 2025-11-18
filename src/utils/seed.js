import IdeaCategory from "../models/IdeaCategory.model.js"

const OCCASION_OPTIONS = [
    { name: "Wedding" },
    { name: "Engagement" },
    { name: "Proposal" },
    { name: "Baby Shower" },
    { name: "Gender Reveal" },
    { name: "Birthday" },
    { name: "Graduation" },
    { name: "Corporate Event" },
    { name: "Brand Launch" },
    { name: "Festivities" },
    { name: "Anniversary" },
  ];


  
  export const seed = async () => {
    try {
      console.log("🌱 Seeding Idea Categories...");
  
      for (const item of OCCASION_OPTIONS) {
        const exists = await IdeaCategory.findOne({ name: item.name });
  
        if (!exists) {
          await IdeaCategory.create({ name: item.name });
          console.log(`✔ Created: ${item.name}`);
        } else {
          console.log(`⏭ Skipped (exists): ${item.name}`);
        }
      }
  
      console.log("🌱 Seeding completed.");
    } catch (error) {
      console.error("❌ Error seeding categories:", error);
    }
  };
  