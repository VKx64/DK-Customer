// Import the PocketBase client from our lib folder
import { pb } from "../../lib/pocketbase";

// FUNCTION TO GET ALL USERS
export async function getAllUsers() {
  try {
    // Fetch all users with pagination to handle large datasets
    const result = await pb.collection("users").getFullList({
      sort: 'created',
      requestKey: null
    });

    // Log the total number of users retrieved
    console.log(`Retrieved ${result.length} users total`);

    // Log detailed information about the first user for debugging
    if (result.length > 0) {
      const firstUser = result[0];
      console.log('================================================================================================');
      console.log('First user details:', firstUser);
      console.log('First user ID:', firstUser.id);
      console.log('First user email:', firstUser.email);
      console.log('First user role:', firstUser.role);
      console.log('================================================================================================');
    }

    return result;
  } catch (error) {
    console.error("Error getting users:", error);
    throw error;
  }
}

// FUNCTION TO GET USERS BY ROLE
export async function getUsersByRole(role) {
  try {
    // Validate role input
    const validRoles = ["admin", "customer", "technician"];
    if (!validRoles.includes(role)) {
      throw new Error(`Invalid role: ${role}. Must be one of: ${validRoles.join(", ")}`);
    }

    // Fetch users with the specified role
    const result = await pb.collection("users").getFullList({
      filter: `role = "${role}"`,
      sort: 'created',
      requestKey: null
    });

    console.log(`Retrieved ${result.length} users with role '${role}'`);
    return result;
  } catch (error) {
    console.error(`Error getting users with role ${role}:`, error);
    throw error;
  }
}

// FUNCTION TO GET USER BY ID
export async function getUserById(userId) {
  try {
    console.log(`Getting user with ID: ${userId}`);

    // Fetch the user with the specified ID
    const user = await pb.collection("users").getOne(userId);

    console.log('================================================================================================');
    console.log('User details:', user);
    console.log('User ID:', user.id);
    console.log('User email:', user.email);
    console.log('User role:', user.role);
    console.log('================================================================================================');

    return user;
  } catch (error) {
    console.error(`Error getting user with ID ${userId}:`, error);
    throw error;
  }
}

// FUNCTION TO SEARCH USERS BY EMAIL
export async function searchUsersByEmail(emailQuery) {
  try {
    console.log(`Searching users with email containing: ${emailQuery}`);

    // Fetch users with email containing the query string
    const result = await pb.collection("users").getFullList({
      filter: `email ~ "${emailQuery}"`,
      sort: 'created',
      requestKey: null
    });

    console.log(`Found ${result.length} users matching email query '${emailQuery}'`);
    return result;
  } catch (error) {
    console.error(`Error searching users by email '${emailQuery}':`, error);
    throw error;
  }
}
