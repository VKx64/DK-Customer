// Import the PocketBase client from our lib folder
import { pb } from "../../lib/pocketbase";

// FUNCTION TO CREATE A NEW ORDER
export async function createOrder(orderData) {
  try {
    console.log('Creating order with data:', orderData);

    // Create the order record
    const newOrder = await pb.collection("user_order").create(orderData);

    // Log the created order for debugging
    console.log('================================================================================================');
    console.log('New order created:', newOrder);
    console.log('Order ID:', newOrder.id);
    console.log('Order status:', newOrder.status);
    console.log('================================================================================================');

    return newOrder;
  } catch (error) {
    console.error("Error creating order:", error);
    throw error;
  }
}

// FUNCTION TO CREATE AN ORDER FROM CART ITEMS
export async function createOrderFromCart(userId, addressId, paymentMode, deliveryFee = 0) {
  try {
    console.log('Creating order from cart for user:', userId);

    // Get cart items for this user
    const cartItems = await pb.collection("user_cart").getFullList({
      filter: `user="${userId}"`,
      expand: "product"
    });

    if (!cartItems || cartItems.length === 0) {
      throw new Error("Cart is empty, cannot create order");
    }

    // Extract product IDs from cart items
    const productIds = cartItems.map(item => item.product);

    // Create the order
    const orderData = {
      user: userId,
      status: "Pending",
      products: productIds,
      mode_of_payment: paymentMode,
      address: addressId,
      delivery_fee: deliveryFee
    };

    // Create the order record
    const newOrder = await pb.collection("user_order").create(orderData);

    // Clear the cart
    for (const item of cartItems) {
      await pb.collection("user_cart").delete(item.id);
    }

    // Log the created order
    console.log('================================================================================================');
    console.log('New order created from cart:', newOrder);
    console.log('Order ID:', newOrder.id);
    console.log('Products:', productIds.length);
    console.log('================================================================================================');

    return newOrder;
  } catch (error) {
    console.error("Error creating order from cart:", error);
    throw error;
  }
}