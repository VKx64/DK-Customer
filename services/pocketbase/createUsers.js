// Import the PocketBase client from our lib folder
import { pb } from "../../lib/pocketbase";

// FUNCTION TO CREATE A NEW USER
export async function createUser(userData, avatarFile = null) {
  try {
    console.log('Creating user with data:', { ...userData, password: '[REDACTED]' });

    // Ensure required fields are present
    if (!userData.email || !userData.password) {
      throw new Error("Email and password are required");
    }

    // Validate role if provided
    if (userData.role && !["admin", "customer", "technician"].includes(userData.role)) {
      throw new Error("Invalid role. Must be admin, customer, or technician");
    }

    // Set default role if not provided
    if (!userData.role) {
      userData.role = "customer";
    }

    // Ensure emailVisibility is set to true
    userData.emailVisibility = true;

    // Create FormData for combined user data and file upload
    const formData = new FormData();

    // Add all user data fields to the form
    Object.keys(userData).forEach(key => {
      formData.append(key, userData[key]);
    });

    // Add avatar if provided
    if (avatarFile) {
      formData.append('avatar', avatarFile);
      console.log('Avatar file included in user creation');
    }

    // Create the user record with the form data
    const newUser = await pb.collection("users").create(formData);

    // Log the created user for debugging
    console.log('================================================================================================');
    console.log('New user created:', { ...newUser, password: '[REDACTED]' });
    console.log('User ID:', newUser.id);
    console.log('User email:', newUser.email);
    console.log('User role:', newUser.role);
    console.log('Email visibility:', newUser.emailVisibility);
    console.log('Avatar included:', avatarFile !== null);
    console.log('================================================================================================');

    return newUser;
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
}

// FUNCTION TO CREATE ADMIN USER
export async function createAdminUser(userData, avatarFile = null) {
  try {
    console.log('Creating admin user with data:', { ...userData, password: '[REDACTED]' });

    // Add admin role
    userData.role = "admin";

    // Create the user with admin role
    const newAdmin = await createUser(userData, avatarFile);

    console.log('================================================================================================');
    console.log('New admin created successfully');
    console.log('Admin ID:', newAdmin.id);
    console.log('Admin email:', newAdmin.email);
    console.log('================================================================================================');

    return newAdmin;
  } catch (error) {
    console.error("Error creating admin user:", error);
    throw error;
  }
}

// FUNCTION TO CREATE TECHNICIAN USER
export async function createTechnicianUser(userData, resumeFile = null, avatarFile = null) {
  try {
    console.log('Creating technician user with data:', { ...userData, password: '[REDACTED]' });

    // Add technician role
    userData.role = "technician";

    // Create the user with technician role
    const newTechnician = await createUser(userData, avatarFile);

    // If a resume file is provided, create a technician_resume record
    if (resumeFile) {
      await pb.collection("technician_resume").create({
        technician: newTechnician.id,
        resume: resumeFile
      });
      console.log('Technician resume uploaded successfully');
    }

    console.log('================================================================================================');
    console.log('New technician created successfully');
    console.log('Technician ID:', newTechnician.id);
    console.log('Technician email:', newTechnician.email);
    console.log('================================================================================================');

    return newTechnician;
  } catch (error) {
    console.error("Error creating technician user:", error);
    throw error;
  }
}

// Keep this function for when you only want to update an avatar
export async function updateUserAvatar(userId, avatarFile) {
  try {
    console.log(`Uploading avatar for user: ${userId}`);

    // Create FormData for file upload
    const formData = new FormData();
    formData.append('avatar', avatarFile);

    // Update the user with the avatar
    const updatedUser = await pb.collection("users").update(userId, formData);

    console.log('================================================================================================');
    console.log('Avatar uploaded successfully for user:', userId);
    console.log('================================================================================================');

    return updatedUser;
  } catch (error) {
    console.error(`Error uploading avatar for user ${userId}:`, error);
    throw error;
  }
}
