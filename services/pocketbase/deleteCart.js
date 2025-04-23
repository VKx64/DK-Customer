// Import the PocketBase client from our lib folder
import { pb } from "../../lib/pocketbase";

// FUNCTION TO REMOVE AN ITEM FROM CART
export async function removeFromCart(cartItemId) {
  try {
    console.log(`Removing cart item with ID: ${cartItemId}`);

    // Delete the cart item
    await pb.collection("user_cart").delete(cartItemId);

    console.log('================================================================================================');
    console.log(`Cart item ${cartItemId} removed successfully`);
    console.log('================================================================================================');

    return true;
  } catch (error) {
    console.error(`Error removing cart item ${cartItemId}:`, error);
    throw error;
  }
}

// FUNCTION TO REMOVE A PRODUCT FROM USER'S CART
export async function removeProductFromCart(userId, productId) {
  try {
    console.log(`Removing product ${productId} from cart for user ${userId}`);

    // Find the cart item with this product and user
    const cartItems = await pb.collection("user_cart").getFullList({
      filter: `user="${userId}" && product="${productId}"`
    });

    if (cartItems.length === 0) {
      console.log(`Product ${productId} not found in user ${userId}'s cart`);
      return { notFound: true };
    }

    // Delete all matching cart items (should be only one, but just in case)
    for (const item of cartItems) {
      await pb.collection("user_cart").delete(item.id);
    }

    console.log('================================================================================================');
    console.log(`Removed ${cartItems.length} cart items for product ${productId}`);
    console.log('================================================================================================');

    return { removed: true, count: cartItems.length };
  } catch (error) {
    console.error(`Error removing product ${productId} from cart:`, error);
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

// FUNCTION TO REMOVE MULTIPLE CART ITEMS
export async function removeMultipleCartItems(cartItemIds) {
  try {
    console.log(`Removing multiple cart items:`, cartItemIds);

    // Validate input
    if (!Array.isArray(cartItemIds) || cartItemIds.length === 0) {
      throw new Error("No valid cart item IDs provided");
    }

    const results = {
      successCount: 0,
      failedCount: 0,
      failedIds: []
    };

    // Process each cart item deletion
    for (const id of cartItemIds) {
      try {
        await pb.collection("user_cart").delete(id);
        results.successCount++;
      } catch (error) {
        console.error(`Error deleting cart item ${id}:`, error);
        results.failedCount++;
        results.failedIds.push(id);
      }
    }

    console.log('================================================================================================');
    console.log(`Batch deletion completed: ${results.successCount} succeeded, ${results.failedCount} failed`);
    console.log('Failed IDs:', results.failedIds);
    console.log('================================================================================================');

    if (results.failedCount > 0) {
      throw new Error(`${results.failedCount} cart items failed to delete`);
    }

    return results;
  } catch (error) {
    console.error("Error in batch cart item deletion:", error);
    throw error;
  }
}
