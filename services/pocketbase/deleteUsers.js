// Import the PocketBase client from our lib folder
import { pb } from "../../lib/pocketbase";

// FUNCTION TO DELETE A USER
export async function deleteUser(id) {
  try {
    console.log(`Deleting user with ID: ${id}`);

    // Delete the user by ID
    await pb.collection("users").delete(id);

    console.log('================================================================================================');
    console.log(`User ${id} deleted successfully`);
    console.log('================================================================================================');

    return true;
  } catch (error) {
    console.error(`Error deleting user ${id}:`, error);
    throw error;
  }
}

// FUNCTION TO DELETE MULTIPLE USERS AT ONCE
export async function deleteManyUsers(userIds) {
  try {
    console.log(`Attempting to delete multiple users:`, userIds);

    // Validate input
    if (!Array.isArray(userIds) || userIds.length === 0) {
      throw new Error("No valid user IDs provided");
    }

    const results = {
      successCount: 0,
      failedCount: 0,
      failedIds: []
    };

    // Process each user deletion
    for (const id of userIds) {
      try {
        await pb.collection("users").delete(id);
        results.successCount++;
      } catch (error) {
        console.error(`Error deleting user ${id}:`, error);
        results.failedCount++;
        results.failedIds.push(id);
      }
    }

    console.log('================================================================================================');
    console.log(`Batch deletion completed: ${results.successCount} succeeded, ${results.failedCount} failed`);
    console.log('Failed IDs:', results.failedIds);
    console.log('================================================================================================');

    if (results.failedCount > 0) {
      throw new Error(`${results.failedCount} users failed to delete`);
    }

    return results;
  } catch (error) {
    console.error("Error in batch user deletion:", error);
    throw error;
  }
}

// FUNCTION TO DELETE USERS BY ROLE
export async function deleteUsersByRole(role) {
  try {
    console.log(`Attempting to delete all users with role: ${role}`);

    // Validate role
    const validRoles = ["admin", "customer", "technician"];
    if (!validRoles.includes(role)) {
      throw new Error(`Invalid role: ${role}. Must be one of: ${validRoles.join(", ")}`);
    }

    // Get all users with the specified role
    const users = await pb.collection("users").getFullList({
      filter: `role = "${role}"`
    });

    if (users.length === 0) {
      console.log(`No users found with role: ${role}`);
      return {
        successCount: 0,
        failedCount: 0,
        failedIds: [],
        message: `No users found with role: ${role}`
      };
    }

    // Extract user IDs
    const userIds = users.map(user => user.id);

    // Delete the users
    return await deleteManyUsers(userIds);
  } catch (error) {
    console.error(`Error deleting users by role ${role}:`, error);
    throw error;
  }
}
