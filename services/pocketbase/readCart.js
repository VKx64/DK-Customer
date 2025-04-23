// Import the PocketBase client from our lib folder
import { pb } from "../../lib/pocketbase";

// FUNCTION TO GET ALL CART ITEMS FOR A USER
export async function getUserCartItems(userId) {
  try {
    console.log(`Getting cart items for user: ${userId}`);

    // Validate userId to prevent API errors
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      throw new Error('Invalid user ID provided');
    }

    // Use a more specific filter with quotes around the user ID
    const filter = `user="${userId}"`;
    console.log(`Using filter: ${filter}`);

    // Fetch all cart items for this user with expanded product information
    const cartItems = await pb.collection("user_cart").getFullList({
      filter: filter,
      expand: "product",
      sort: "+created",
      requestKey: `cart-${userId}` // Add unique request key to avoid cancellation issues
    });

    // Log the total number of cart items retrieved
    console.log(`Retrieved ${cartItems.length} cart items for user ${userId}`);

    // Log detailed information about the first item for debugging
    if (cartItems.length > 0) {
      const firstItem = cartItems[0];
      console.log('================================================================================================');
      console.log('First cart item details:', firstItem);
      console.log('Cart item ID:', firstItem.id);
      console.log('Product:', firstItem.expand?.product?.product_name);
      console.log('Quantity:', firstItem.quantity);
      console.log('================================================================================================');
    }

    return cartItems;
  } catch (error) {
    console.error(`Error getting cart items for user ${userId}:`, error);

    // Try an alternative approach with getList instead of getFullList
    try {
      console.log(`Trying alternative method for user ${userId}`);
      const result = await pb.collection("user_cart").getList(1, 100, {
        filter: `user="${userId}"`,
        expand: "product",
        sort: "+created"
      });
      console.log(`Alternative method succeeded: ${result.items.length} items`);
      return result.items;
    } catch (fallbackError) {
      console.error(`Alternative method also failed for user ${userId}:`, fallbackError);
      // If both methods fail, throw the original error
      throw error;
    }
  }
}

// FUNCTION TO GET SPECIFIC CART ITEM
export async function getCartItemById(cartItemId) {
  try {
    console.log(`Getting cart item with ID: ${cartItemId}`);

    // Fetch the cart item
    const cartItem = await pb.collection("user_cart").getOne(cartItemId, {
      expand: "product,user"
    });

    console.log('================================================================================================');
    console.log('Cart item details:', cartItem);
    console.log('Cart item ID:', cartItem.id);
    console.log('Product:', cartItem.expand?.product?.product_name);
    console.log('User:', cartItem.expand?.user?.email);
    console.log('Quantity:', cartItem.quantity);
    console.log('================================================================================================');

    return cartItem;
  } catch (error) {
    console.error(`Error getting cart item ${cartItemId}:`, error);
    throw error;
  }
}

// FUNCTION TO GET CART SUMMARY (TOTAL ITEMS AND COST)
export async function getUserCartSummary(userId) {
  try {
    console.log(`Getting cart summary for user: ${userId}`);

    // Get all cart items with expanded product info
    const cartItems = await pb.collection("user_cart").getFullList({
      filter: `user="${userId}"`,
      expand: "product.product_pricing"
    });

    let totalItems = 0;
    let totalCost = 0;

    // Calculate totals
    for (const item of cartItems) {
      totalItems += item.quantity;

      // If product has pricing information, add to total cost
      if (item.expand?.product &&
          item.expand.product.expand?.product_pricing &&
          item.expand.product.expand.product_pricing.length > 0) {
        const pricing = item.expand.product.expand.product_pricing[0];
        totalCost += (pricing.final_price || pricing.base_price || 0) * item.quantity;
      }
    }

    const summary = {
      itemCount: cartItems.length,
      totalItems,
      totalCost,
      items: cartItems
    };

    console.log('================================================================================================');
    console.log(`Cart summary for user ${userId}:`);
    console.log(`Number of distinct items: ${summary.itemCount}`);
    console.log(`Total items: ${totalItems}`);
    console.log(`Estimated total cost: ${totalCost}`);
    console.log('================================================================================================');

    return summary;
  } catch (error) {
    console.error(`Error getting cart summary for user ${userId}:`, error);
    throw error;
  }
}
