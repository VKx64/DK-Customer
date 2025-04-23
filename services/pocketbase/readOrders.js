// Import the PocketBase client from our lib folder
import { pb } from "../../lib/pocketbase";

// FUNCTION TO GET ALL ORDERS
export async function getAllOrders() {
  try {
    // Fetch all orders with expanded relations
    const result = await pb.collection("user_order").getFullList({
      expand: 'user,address',
      requestKey: null
    });

    // Log the total number of orders retrieved
    console.log(`Retrieved ${result.length} orders total`);

    // Log detailed information about the first order for debugging
    if (result.length > 0) {
      const firstOrder = result[0];
      console.log('================================================================================================');
      console.log('First order details:', firstOrder);
      console.log('First order ID:', firstOrder.id);
      console.log('First order expanded user:', firstOrder.expand?.user);
      console.log('First order expanded address:', firstOrder.expand?.address);
      console.log('================================================================================================');
    }

    return result;
  } catch (error) {
    console.error("Error getting orders:", error);
    throw error;
  }
}
