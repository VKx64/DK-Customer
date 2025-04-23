import Image from "next/image";
import Link from "next/link";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle
} from "@/components/ui/navigation-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronDown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function NavBar() {
  const { user, logout, isUserLoading } = useAuth();

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (!user || !user.name) return "U";
    const names = user.name.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return names[0][0].toUpperCase();
  };

  // Handle logout click
  const handleLogout = () => {
    logout();
  };

  // Determine avatar source
  const getAvatarSrc = () => {
    if (user?.avatar) {
      // If using PocketBase, you'll need to construct the URL
      return `${process.env.NEXT_PUBLIC_POCKETBASE_URL}/api/files/users/${user.id}/${user.avatar}`;
    }
    return "/Images/default_user.jpg";
  };

  return (
    <div className="border-b bg-white z-50 shadow-sm">
      <div className="flex h-fit items-center p-2 container mx-auto">

        {/* Logo on left */}
        <div className="mr-4 flex">
          <Link href="/" className="flex items-center space-x-2">
            <Image
              src="/Images/daikin-logo.png"
              alt="Daikin Logo"
              width={120}
              height={40}
              className="h-14 w-auto"
            />
          </Link>
        </div>

        {/* Navigation in center */}
        <div className="flex items-center justify-center flex-1">
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <Link href="/" legacyBehavior passHref>
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    Products
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link href="/categories" legacyBehavior passHref>
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    Categories
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link href="/service" legacyBehavior passHref>
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    Service
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* User dropdown on right */}
        <div className="ml-auto flex items-center">
          {isUserLoading ? (
            // Loading state
            <div className="flex items-center gap-2 px-3 py-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="animate-pulse">...</AvatarFallback>
              </Avatar>
              <span className="w-16 h-4 bg-gray-200 animate-pulse rounded"></span>
            </div>
          ) : user ? (
            // Authenticated state
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent transition-colors focus:outline-none">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={getAvatarSrc()} alt={user.name || "User"} />
                    <AvatarFallback>{getUserInitials()}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{user.name || user.email}</span>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/profile" className="w-full">Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/cart" className="w-full">Cart</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/orders" className="w-full">Orders</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/settings" className="w-full">Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="cursor-pointer text-destructive focus:text-destructive">
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            // Not authenticated state
            <Link href="/authentication" className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
              Login
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
