"use client";
export default function AuthenticationLayout({ children }) {
  return (
    <div className="flex flex-col h-screen">
      {children}
    </div>
  );
}