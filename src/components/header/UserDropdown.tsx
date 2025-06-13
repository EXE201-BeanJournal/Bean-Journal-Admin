import { SignedIn, SignedOut, UserButton } from "@clerk/clerk-react";
import { Link } from "react-router-dom";

export default function UserDropdown() {
  return (
    <div className="relative flex items-center h-11">
      <SignedIn>
        <UserButton afterSignOutUrl="/signin" />
      </SignedIn>
      <SignedOut>
        <Link
          to="/signin"
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700"
        >
          Sign In
        </Link>
      </SignedOut>
    </div>
  );
}
