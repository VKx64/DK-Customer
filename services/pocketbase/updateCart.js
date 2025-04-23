// Import the PocketBase client from our lib folder
import { pb } from "../../lib/pocketbase";

// FUNCTION TO UPDATE CART ITEM QUANTITY
export async function updateCartItemQuantity(cartItemId, newQuantity) {
  try {
    console.log(`Updating cart item ${cartItemId} quantity to ${newQuantity}`);

    // Validate quantity
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

// FUNCTION TO UPDATE USER'S MULTIPLE CART ITEMS
export async function updateMultipleCartItems(cartUpdates) {
  try {
    console.log(`Updating multiple cart items:`, cartUpdates);

    // Validate input
    if (!Array.isArray(cartUpdates) || cartUpdates.length === 0) {
      throw new Error("No valid cart updates provided");
    }

    const results = {
      successCount: 0,
      failedCount: 0,
      failedItems: []
    };

    // Process each cart item update
    for (const update of cartUpdates) {
      try {
        if (!update.cartItemId || !update.quantity) {
          throw new Error("Missing required fields");
        }

        await updateCartItemQuantity(update.cartItemId, update.quantity);
        results.successCount++;
      } catch (error) {
        console.error(`Error updating cart item ${update.cartItemId}:`, error);
        results.failedCount++;
        results.failedItems.push(update.cartItemId);
      }
    }

    console.log('================================================================================================');
    console.log(`Batch update completed: ${results.successCount} succeeded, ${results.failedCount} failed`);
    console.log('Failed items:', results.failedItems);
    console.log('================================================================================================');

    if (results.failedCount > 0) {
      throw new Error(`${results.failedCount} cart items failed to update`);
    }

    return results;
  } catch (error) {
    console.error("Error in batch cart update:", error);
    throw error;
  }
}

// FUNCTION TO SET QUANTITY OF PRODUCT IN CART
export async function setProductQuantityInCart(userId, productId, quantity) {
  try {
    console.log(`Setting quantity to ${quantity} for product ${productId} in user ${userId}'s cart`);

    // Find if the item already exists in cart
    const existingCartItems = await pb.collection("user_cart").getList(1, 1, {
      filter: `user="${userId}" && product="${productId}"`
    });

    // If quantity is 0 or less, remove the item from cart
    if (quantity <= 0) {
      if (existingCartItems.items.length > 0) {
        await pb.collection("user_cart").delete(existingCartItems.items[0].id);
        console.log(`Removed product ${productId} from cart (quantity was set to ${quantity})`);
        return { removed: true, productId };
      }
      return { alreadyRemoved: true, productId };
    }

    // If item exists, update quantity
    if (existingCartItems.items.length > 0) {
      const cartItem = existingCartItems.items[0];
      return await updateCartItemQuantity(cartItem.id, quantity);
    }
    // If item doesn't exist, create new cart item
    else {
      const cartData = {
        user: userId,
        product: productId,
        quantity: quantity
      };

      const newCartItem = await pb.collection("user_cart").create(cartData);

      console.log('================================================================================================');
      console.log('New item added to cart:', newCartItem);
      console.log('Cart item ID:', newCartItem.id);
      console.log('Quantity:', newCartItem.quantity);
      console.log('================================================================================================');

      return newCartItem;
    }
  } catch (error) {
    console.error(`Error setting product ${productId} quantity in cart:`, error);
    throw error;
  }
}
