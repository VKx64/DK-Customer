// Import the PocketBase client from our lib folder
import { pb } from "../../lib/pocketbase";

// FUNCTION TO ADD ITEM TO CART
export async function addToCart(userId, productId, quantity = 1) {
  try {
    console.log(`Adding product ${productId} to cart for user ${userId} with quantity ${quantity}`);

    // Check if the product already exists in user's cart
    const existingCartItems = await pb.collection("user_cart").getList(1, 1, {
      filter: `user="${userId}" && product="${productId}"`
    });

    if (existingCartItems.items.length > 0) {
      // Product exists in cart, update quantity instead
      const existingItem = existingCartItems.items[0];
      const newQuantity = existingItem.quantity + quantity;

      return await updateCartItemQuantity(existingItem.id, newQuantity);
    }

    // Create the cart item
    const cartData = {
      user: userId,
      product: productId,
      quantity: quantity
    };

    const newCartItem = await pb.collection("user_cart").create(cartData);

    // Log the created cart item for debugging
    console.log('================================================================================================');
    console.log('Item added to cart:', newCartItem);
    console.log('Cart item ID:', newCartItem.id);
    console.log('Product ID:', newCartItem.product);
    console.log('Quantity:', newCartItem.quantity);
    console.log('================================================================================================');

    return newCartItem;
  } catch (error) {
    console.error("Error adding item to cart:", error);
    throw error;
  }
}

// FUNCTION TO UPDATE CART ITEM QUANTITY
async function updateCartItemQuantity(cartItemId, newQuantity) {
  try {
    console.log(`Updating cart item ${cartItemId} quantity to ${newQuantity}`);

    // Ensure quantity is at least 1
    if (newQuantity < 1) {
      throw new Error("Quantity must be at least 1");
    }

    // Update the cart item with new quantity
    const updatedCartItem = await pb.collection("user_cart").update(cartItemId, {
      quantity: newQuantity
    });

    console.log('================================================================================================');
    console.log('Updated cart item:', updatedCartItem);
    console.log('Cart item ID:', updatedCartItem.id);
    console.log('New quantity:', updatedCartItem.quantity);
    console.log('================================================================================================');

    return updatedCartItem;
  } catch (error) {
    console.error(`Error updating cart item ${cartItemId}:`, error);
    throw error;
  }
}

// FUNCTION TO BULK ADD ITEMS TO CART
export async function bulkAddToCart(userId, items) {
  try {
    console.log(`Adding multiple items to cart for user ${userId}`);

    // Validate input
    if (!Array.isArray(items) || items.length === 0) {
      throw new Error("No valid items provided");
    }

    const results = {
      successCount: 0,
      failedCount: 0,
      failedItems: []
    };

    // Process each item addition
    for (const item of items) {
      try {
        if (!item.productId || !item.quantity) {
          throw new Error("Missing required fields");
        }

        await addToCart(userId, item.productId, item.quantity);
        results.successCount++;
      } catch (error) {
        console.error(`Error adding item ${item.productId} to cart:`, error);
        results.failedCount++;
        results.failedItems.push(item.productId);
      }
    }

    console.log('================================================================================================');
    console.log(`Bulk addition completed: ${results.successCount} succeeded, ${results.failedCount} failed`);
    console.log('Failed items:', results.failedItems);
    console.log('================================================================================================');

    if (results.failedCount > 0) {
      throw new Error(`${results.failedCount} items failed to add to cart`);
    }

    return results;
  } catch (error) {
    console.error("Error in bulk cart addition:", error);
    throw error;
  }
}
