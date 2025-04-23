"use client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState, useRef } from "react";
import { ImageIcon, Loader2 } from "lucide-react";
import { createUser } from "@/services/pocketbase/createUsers";
import { toast } from "sonner";

export function RegisterForm({ className, onRegistrationSuccess, ...props }) {
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const fileInputRef = useRef(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  // Error and loading states
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatar(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current.click();
  };

  // Handle input changes
  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));

    // Clear error when field is edited
    if (errors[id]) {
      setErrors((prev) => ({
        ...prev,
        [id]: "",
      }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    // Confirm password validation
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // Prepare user data
      const userData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        passwordConfirm: formData.confirmPassword, // Required by PocketBase
        role: "customer", // Default role
        emailVisibility: true, // Ensure email visibility is set to true
      };

      // Create user in PocketBase with avatar in a single operation
      const newUser = await createUser(userData, avatar);

      // Show success message using correct Sonner syntax
      toast("Registration successful!", {
        description: "Your account has been created.",
      });

      // Clear the form
      setFormData({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
      });
      setAvatarPreview(null);
      setAvatar(null);

      // Switch to login tab if the callback is provided
      if (onRegistrationSuccess && typeof onRegistrationSuccess === 'function') {
        onRegistrationSuccess();
      }
    } catch (error) {
      console.error("Registration error:", error);

      // Show error message using correct Sonner syntax
      toast("Registration failed", {
        description: error.message || "Something went wrong. Please try again.",
        style: { backgroundColor: "red", color: "white" },
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Create an account</CardTitle>
          <CardDescription>
            Fill in your details below to create a new account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center gap-4">
                <Label>Profile Picture</Label>
                <Avatar
                  className="h-24 w-24 cursor-pointer border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors"
                  onClick={handleAvatarClick}
                >
                  <AvatarImage src={avatarPreview} alt="Avatar" />
                  <AvatarFallback className="bg-muted">
                    <ImageIcon className="h-10 w-10 text-muted-foreground" />
                  </AvatarFallback>
                </Avatar>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>
              <div className="flex flex-col gap-4">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter your name"
                  disabled={isSubmitting}
                />
                {errors.name && (
                  <p className="text-red-500 text-sm">{errors.name}</p>
                )}
              </div>
              <div className="flex flex-col gap-4">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email"
                  disabled={isSubmitting}
                />
                {errors.email && (
                  <p className="text-red-500 text-sm">{errors.email}</p>
                )}
              </div>
              <div className="flex flex-col gap-4">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter your password"
                  disabled={isSubmitting}
                />
                {errors.password && (
                  <p className="text-red-500 text-sm">{errors.password}</p>
                )}
              </div>
              <div className="flex flex-col gap-4">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Confirm your password"
                  disabled={isSubmitting}
                />
                {errors.confirmPassword && (
                  <p className="text-red-500 text-sm">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="animate-spin h-4 w-4" />
                ) : (
                  "Register"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}