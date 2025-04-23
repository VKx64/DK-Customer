// src/lib/pocketbase.js
import PocketBase from "pocketbase";

let pb = null;

try {
  const pbUrl = process.env.NEXT_PUBLIC_POCKETBASE_URL;
  if (!pbUrl) {
    console.error("PocketBase URL env var not set.");
  } else {
    pb = new PocketBase(pbUrl);
  }
} catch (error) {
  console.error("PocketBase initialization failed:", error.message);
  pb = null;
}

export { pb };

/** Gets the current user model, or null. */
export const getCurrentUser = () => pb?.authStore?.model || null;

/** Gets the authStore instance, or null. */
export const getAuthStore = () => pb?.authStore || null;
