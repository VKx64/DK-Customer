import { pb } from "../../lib/pocketbase";

const POCKETBASE_URL = "https://db-daikin.07130116.xyz";

export async function getCategories() {
  try {
    const records = await pb.collection("products").getFullList({
      fields: "id,category,image",
      requestKey: null,
    });

    const categoryMap = {};
    records.forEach((record) => {
      if (record.category && !categoryMap[record.category]) {
        const imageUrl = record.image
          ? `${POCKETBASE_URL}/api/files/products/${record.id}/${record.image}`
          : null;
        categoryMap[record.category] = imageUrl;
      }
    });

    return Object.entries(categoryMap).map(([cat, image], idx) => ({
      id: idx,
      name: cat,
      imageUrl: image,
    }));
  } catch (error) {
    console.error("Error fetching categories:", error);
    throw error;
  }
}
