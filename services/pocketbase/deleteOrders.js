// Import the PocketBase client from our lib folder
import { pb } from "../../lib/pocketbase";

// FUNCTION TO DELETE AN ORDER
export async function deleteOrder(id) {
  try {
    console.log(`Deleting order with ID: ${id}`);

    // Delete the order by its ID
    await pb.collection("user_order").delete(id);

    console.log('================================================================================================');
    console.log(`Order ${id} deleted successfully`);
    console.log('================================================================================================');

    return true;
  } catch (error) {
    console.error(`Error deleting order ${id}:`, error);
    throw error;
  }
}

// FUNCTION TO DELETE MULTIPLE ORDERS AT ONCE
export async function deleteManyOrders(orderIds) {
  try {
    console.log(`Attempting to delete multiple orders:`, orderIds);

    // Validate input
    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      throw new Error("No valid order IDs provided");
    }

    const results = {
      successCount: 0,
      failedCount: 0,
      failedIds: []
    };

    // Process each order deletion
    for (const id of orderIds) {
      try {
        await pb.collection("user_order").delete(id);
        results.successCount++;
      } catch (error) {
        console.error(`Error deleting order ${id}:`, error);
        results.failedCount++;
        results.failedIds.push(id);
      }
    }

    console.log('================================================================================================');
    console.log(`Batch deletion completed: ${results.successCount} succeeded, ${results.failedCount} failed`);
    console.log('Failed IDs:', results.failedIds);
    console.log('================================================================================================');

    if (results.failedCount > 0) {
      throw new Error(`${results.failedCount} orders failed to delete`);
    }

    return results;
  } catch (error) {
    console.error("Error in batch order deletion:", error);
    throw error;
  }
}

// FUNCTION TO CLEAR USER CART
export async function clearUserCart(userId) {
  try {
    console.log(`Clearing cart for user ID: ${userId}`);

    // Get all cart items for this user
    const cartItems = await pb.collection("user_cart").getFullList({
      filter: `user="${userId}"`
    });

    if (cartItems.length === 0) {
      console.log(`Cart is already empty for user ID: ${userId}`);
      return 0;
    }

    // Delete each cart item
    let deletedCount = 0;
    for (const item of cartItems) {
      await pb.collection("user_cart").delete(item.id);
      deletedCount++;
    }

    console.log('================================================================================================');
    console.log(`Cart cleared successfully for user ID: ${userId}`);
    console.log(`Deleted ${deletedCount} items from cart`);
    console.log('================================================================================================');

    return deletedCount;
  } catch (error) {
    console.error(`Error clearing cart for user ${userId}:`, error);
    throw error;
  }
}
