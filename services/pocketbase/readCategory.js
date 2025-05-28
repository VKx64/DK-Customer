import { pb } from "../../lib/pocketbase";

// 1. FUNCTION TO GET UNIQUE CATEGORIES FROM PRODUCTS
export async function getCategories() {
  try {
    console.log("Fetching all product categories...");
    // Fetch all products, only requesting the 'category' field
    const records = await pb.collection("products").getFullList({
      fields: "category",
      requestKey: null, // Prevent auto cancellation errors
    });

    // Extract unique categories
    const categories = [
      ...new Set(records.map((record) => record.category).filter(Boolean)),
    ];

    // Log the found categories
    console.log(`Found ${categories.length} unique categories:`, categories);

    // Return as array of objects for easier mapping in React
    return categories.map((cat, idx) => ({
      id: idx,
      name: cat,
    }));
  } catch (error) {
    console.error("Error fetching categories:", error);
    throw error;
  }
}
