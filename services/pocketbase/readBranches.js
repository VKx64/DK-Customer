import { pb } from '@/lib/pocketbase';

/**
 * Fetch all branches from the database
 * @returns {Promise<Array>} Array of branch records
 */
export const getAllBranches = async () => {
  try {
    const branches = await pb.collection("branch_details").getFullList({
      requestKey: null
    });
    return branches;
  } catch (error) {
    console.error("Failed to fetch branches:", error);
    return [];
  }
};

/**
 * Fetch a specific branch by ID
 * @param {string} branchId - The ID of the branch to fetch
 * @returns {Promise<Object|null>} Branch record or null if not found
 */
export const getBranchById = async (branchId) => {
  try {
    const branch = await pb.collection("branch_details").getOne(branchId, {
      requestKey: null
    });
    return branch;
  } catch (error) {
    console.error(`Failed to fetch branch ${branchId}:`, error);
    return null;
  }
};
