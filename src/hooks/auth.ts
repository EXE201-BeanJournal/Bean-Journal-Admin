import { useAuth, useClerk, useUser } from "@clerk/clerk-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";

// Public routes that don't require authentication
const publicRoutes = ["/signin", "/signup", "/unauthorized"];

// Routes accessible to any authenticated user, regardless of role
const commonAuthenticatedRoutes = ["/profile"];

// Get environment variables with fallbacks
const getEnvVar = (key: string, fallback: string): string => {
  const value = import.meta.env[`VITE_CLERK_${key}`];
  return value || fallback;
};

/**
 * This is our middleware-like functionality for React Router
 * It handles authentication and route protection at the client level
 */
export function useAuthProtection() {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const { user } = useUser();
  const clerk = useClerk();
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  const searchParams = new URLSearchParams(location.search);
  const returnUrl = searchParams.get('redirect') || "/journal";
  
  useEffect(() => {
    if (!isLoaded) return;
    
    // 1. Check if the current route is public
    const isPublicRoute = publicRoutes.some(route => 
      currentPath === route || currentPath.startsWith(`${route}/`)
    );
    
    // 2. Protect non-public routes
    if (!isPublicRoute && !isSignedIn) {
      // If not authenticated and trying to access a protected route, redirect to login
      navigate(
        `${getEnvVar("SIGN_IN_URL", "/signin")}?redirect=${currentPath}`
      );
      return;
    }
    
    // 3. Handle authenticated users
    if (isSignedIn) {
      // If user is on an auth page, redirect away
      if (currentPath === "/signin" || currentPath === "/signup") {
        navigate(getEnvVar("AFTER_SIGN_IN_URL", "/journal"));
        return;
      }
      
      // 4. Role-based authorization for admin dashboard
      const isCommonRoute = commonAuthenticatedRoutes.some(route =>
        currentPath === route || currentPath.startsWith(`${route}/`)
      );

      // We need to wait for the user object to be loaded
      if (user) {
        const roles = (user.publicMetadata?.roles || []) as string[];
        if (!roles.includes("admin") && !isPublicRoute && !isCommonRoute) {
          navigate("/unauthorized");
          return;
        }
      }
    }
  }, [isLoaded, isSignedIn, user, currentPath, navigate, userId]);
  
  // Expose the auth state for components to use
  return {
    isLoaded,
    isSignedIn,
    userId,
    signOut: clerk.signOut,
    returnUrl
  };
}

/**
 * Helper for components to use Clerk auth URLs consistently
 */
export function useAuthUrls() {
  return {
    signInUrl: getEnvVar("SIGN_IN_URL", "/signin"),
    signUpUrl: getEnvVar("SIGN_UP_URL", "/signup"),
    afterSignInUrl: getEnvVar("AFTER_SIGN_IN_URL", "/journal"),
    afterSignUpUrl: getEnvVar("AFTER_SIGN_UP_URL", "/journal")
  };
} 