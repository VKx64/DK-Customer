// Import the PocketBase client from our lib folder
import { pb } from "../../lib/pocketbase";

// FUNCTION TO UPDATE BASIC ORDER INFORMATION
export async function updateOrder(id, orderData) {
  try {
    console.log(`Updating order ${id} with data:`, orderData);

    // Update the order with the new data
    const updatedOrder = await pb.collection("user_order").update(id, orderData);

    console.log('================================================================================================');
    console.log('Updated order:', updatedOrder);
    console.log('Order ID:', updatedOrder.id);
    console.log('Order status:', updatedOrder.status);
    console.log('================================================================================================');

    return updatedOrder;
  } catch (error) {
    console.error(`Error updating order ${id}:`, error);
    throw error;
  }
}

// FUNCTION TO UPDATE ORDER STATUS
export async function updateOrderStatus(orderId, newStatus) {
  try {
    console.log(`Updating order ${orderId} status to: ${newStatus}`);

    // Validate status
    const validStatuses = ["Pending", "Approved", "Declined"];
    if (!validStatuses.includes(newStatus)) {
      throw new Error(`Invalid status: ${newStatus}. Must be one of: ${validStatuses.join(", ")}`);
    }

    // Update the order status
    const updatedOrder = await pb.collection("user_order").update(orderId, {
      status: newStatus
    });

    console.log('================================================================================================');
    console.log('Updated order status:', updatedOrder);
    console.log('Order ID:', updatedOrder.id);
    console.log('New status:', updatedOrder.status);
    console.log('================================================================================================');

    return updatedOrder;
  } catch (error) {
    console.error(`Error updating status for order ${orderId}:`, error);
    throw error;
  }
}

// FUNCTION TO UPDATE MULTIPLE ORDERS' STATUS
export async function updateBatchOrdersStatus(orderIds, newStatus) {
  try {
    console.log(`Updating status for multiple orders to ${newStatus}`);

    // Validate inputs
    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      throw new Error("No valid order IDs provided");
    }

    const validStatuses = ["Pending", "Approved", "Declined"];
    if (!validStatuses.includes(newStatus)) {
      throw new Error(`Invalid status: ${newStatus}. Must be one of: ${validStatuses.join(", ")}`);
    }

    const results = {
      successCount: 0,
      failedCount: 0,
      failedIds: []
    };

    // Process each order update
    for (const id of orderIds) {
      try {
        await pb.collection("user_order").update(id, { status: newStatus });
        results.successCount++;
      } catch (error) {
        console.error(`Error updating order ${id}:`, error);
        results.failedCount++;
        results.failedIds.push(id);
      }
    }

    console.log('================================================================================================');
    console.log(`Batch update completed: ${results.successCount} succeeded, ${results.failedCount} failed`);
    console.log('Failed IDs:', results.failedIds);
    console.log('================================================================================================');

    if (results.failedCount > 0) {
      throw new Error(`${results.failedCount} orders failed to update`);
    }

    return results;
  } catch (error) {
    console.error("Error in batch order status update:", error);
    throw error;
  }
}
