"use client";
import React, { useState } from "react";
import { LoginForm } from "@/components/login-form";
import { RegisterForm } from "@/components/register-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const AuthenticationPage = () => {
  const [activeTab, setActiveTab] = useState("login");

  // Function to switch to login tab after registration
  const switchToLoginTab = () => {
    setActiveTab("login");
  };

  // Function to switch to register tab from login
  const switchToRegisterTab = () => {
    setActiveTab("register");
  };

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>
          <TabsContent value="login">
            <LoginForm onSwitchToRegister={switchToRegisterTab} />
          </TabsContent>
          <TabsContent value="register">
            <RegisterForm onRegistrationSuccess={switchToLoginTab} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AuthenticationPage;
