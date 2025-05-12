import { pb } from "@/lib/pocketbase";

/**
 * Get all delivery information (addresses) for a specific user
 * @param {string} userId - The ID of the user to fetch addresses for
 * @returns {Promise<Array>} - A promise that resolves to an array of address objects
 */
export async function getUserAddresses(userId) {
  try {
    const result = await pb.collection('delivery_information').getList(1, 50, {
      filter: `user = "${userId}"`,
      sort: '-created',
    });
    
    return result.items;
  } catch (error) {
    console.error("Error fetching user addresses:", error);
    throw error;
  }
}

/**
 * Get a specific address by ID
 * @param {string} addressId - The ID of the address to fetch
 * @returns {Promise<Object>} - A promise that resolves to the address object
 */
export async function getAddressById(addressId) {
  try {
    const result = await pb.collection('delivery_information').getOne(addressId);
    return result;
  } catch (error) {
    console.error("Error fetching address by ID:", error);
    throw error;
  }
}
