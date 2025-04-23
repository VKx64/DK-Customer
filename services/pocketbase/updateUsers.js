// Import the PocketBase client from our lib folder
import { pb } from "../../lib/pocketbase";

// FUNCTION TO UPDATE USER INFORMATION
export async function updateUser(id, userData) {
  try {
    // Don't log passwords in console for security
    const logSafeData = { ...userData };
    if (logSafeData.password) {
      logSafeData.password = '[REDACTED]';
    }

    console.log(`Updating user ${id} with data:`, logSafeData);

    // Update the user with the new data
    const updatedUser = await pb.collection("users").update(id, userData);

    // Log results without sensitive data
    const logSafeUser = { ...updatedUser };
    if (logSafeUser.password) {
      logSafeUser.password = '[REDACTED]';
    }

    console.log('================================================================================================');
    console.log('Updated user:', logSafeUser);
    console.log('User ID:', updatedUser.id);
    console.log('User email:', updatedUser.email);
    console.log('User role:', updatedUser.role);
    console.log('================================================================================================');

    return updatedUser;
  } catch (error) {
    console.error(`Error updating user ${id}:`, error);
    throw error;
  }
}

// FUNCTION TO UPDATE USER ROLE
export async function updateUserRole(userId, newRole) {
  try {
    console.log(`Updating user ${userId} role to: ${newRole}`);

    // Validate role
    const validRoles = ["admin", "customer", "technician"];
    if (!validRoles.includes(newRole)) {
      throw new Error(`Invalid role: ${newRole}. Must be one of: ${validRoles.join(", ")}`);
    }

    // Update the user role
    const updatedUser = await pb.collection("users").update(userId, {
      role: newRole
    });

    console.log('================================================================================================');
    console.log('Updated user role:', updatedUser);
    console.log('User ID:', updatedUser.id);
    console.log('New role:', updatedUser.role);
    console.log('================================================================================================');

    return updatedUser;
  } catch (error) {
    console.error(`Error updating role for user ${userId}:`, error);
    throw error;
  }
}

// FUNCTION TO UPDATE USER PASSWORD
export async function updateUserPassword(userId, newPassword) {
  try {
    console.log(`Updating password for user ${userId}`);

    // Update the password
    const updatedUser = await pb.collection("users").update(userId, {
      password: newPassword,
      passwordConfirm: newPassword // Required by PocketBase for password changes
    });

    console.log('================================================================================================');
    console.log(`Password updated successfully for user ${userId}`);
    console.log('================================================================================================');

    return updatedUser;
  } catch (error) {
    console.error(`Error updating password for user ${userId}:`, error);
    throw error;
  }
}

// FUNCTION TO VERIFY USER EMAIL
export async function verifyUserEmail(userId) {
  try {
    console.log(`Manually verifying email for user ${userId}`);

    // Set the verified flag to true
    const updatedUser = await pb.collection("users").update(userId, {
      verified: true
    });

    console.log('================================================================================================');
    console.log(`Email verified successfully for user ${userId}`);
    console.log('================================================================================================');

    return updatedUser;
  } catch (error) {
    console.error(`Error verifying email for user ${userId}:`, error);
    throw error;
  }
}
