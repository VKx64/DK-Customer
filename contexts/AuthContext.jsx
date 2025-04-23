"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { pb } from "@/lib/pocketbase"; // Adjust path
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const AuthContext = createContext(undefined);

/** Provides authentication state and actions */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined);
  const router = useRouter();

  // Initialize PocketBase and set up user state
  useEffect(() => {
    if (pb) {
      // Check if the stored user has a valid role
      const currentUser = pb.authStore.model;
      if (currentUser && currentUser.role?.toLowerCase() !== "customer") {
        // If user is logged in but not a customer, log them out
        pb.authStore.clear();
        setUser(null);
      } else {
        setUser(currentUser);
      }

      const unsubscribe = pb.authStore.onChange((token, model) => {
        // Only set user if they have the customer role
        if (model && model.role?.toLowerCase() === "customer") {
          setUser(model);
        } else {
          setUser(null);
        }
      });
      return () => unsubscribe();
    } else {
      console.warn("AuthProvider: pb instance is null.");
      setUser(null);
    }
  }, []);

  // Login function
  const login = async (email, password) => {
    if (!pb) {
      toast.error("Login service unavailable.");
      throw new Error("Login service unavailable");
    }

    try {
      const authData = await pb
        .collection("users")
        .authWithPassword(email, password);

      // Validate the user role - only allow customers
      if (authData.record?.role?.toLowerCase() !== "customer") {
        // If not a customer, clear the auth store and throw an error
        pb.authStore.clear();
        toast.error("Access denied. Only customers can log in here.");
        throw new Error("Access denied. Only customers can log in here.");
      }

      toast.success("Login successful!");
      router.push("/"); // Redirect to main URL instead of /customer
      return authData.record;
    } catch (error) {
      console.error("Login failed:", error);

      // Customize error message for non-customer users
      if (error.message?.includes("Access denied")) {
        // The error message is already shown via toast
      } else {
        // Generic error for other login issues
        toast.error("Login failed. Check credentials.");
      }
      throw error;
    }
  };

  // logout function
  const logout = () => {
    if (!pb) return;
    pb.authStore.clear();
    toast.success("Logged out successfully");
    router.push("/");
  };

  // Redirect based on user role - modified to only allow customer
  const redirectUser = (role) => {
    const targetRole = role?.toLowerCase();
    if (targetRole === "customer") {
      router.push("/");
    } else {
      // For non-customer roles, log out and redirect to authentication
      if (pb) pb.authStore.clear();
      router.push("/authentication");
    }
  };

  // Contexts stored in browser
  const contextValue = {
    user,
    login,
    logout,
    redirectUser,
    isUserLoading: user === undefined,
    isPbInitialized: !!pb,
    isCustomer: user?.role?.toLowerCase() === "customer"
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

/** Hook to access authentication context */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
