"use client";
import React, { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { isAuthenticated } from "../../services/authService";
import { getCurrentUser } from "../../services/userService"; // Import getCurrentUser
import UserInfoCard from "./UserInfoCard";
import DashboardSidebar from "./DashboardSidebar";
import DashboardContent from "./DashboardContent";
import { redirectToLogin } from "../../utils/authRedirect";

interface CurrentUser {
  name?: string;
  phoneNumber?: string;
  email?: string;
  [key: string]: unknown;
}

const UserDashboardLayout: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const initialPathRef = useRef(pathname);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true); // Add loading state

  const getActiveSectionFromPath = (path: string): string => {
    const parts = path.split("/").filter(Boolean);
    if (parts.length === 1 && parts[0] === "my-account") {
      return "overview";
    }
    if (parts.includes("profile") && parts.includes("edit")) {
      return "edit-profile";
    }
    if (parts.length >= 2 && parts[0] === "my-account") {
      return parts[1];
    }
    return "overview";
  };

  const activeSection = getActiveSectionFromPath(pathname);

  const onSelectSection = (section: string) => {
    if (section === "overview") {
      router.push("/my-account");
    } else if (section === "edit-profile") {
      router.push("/my-account/profile/edit");
    } else if (section === "profile") {
      router.push("/my-account/profile");
    } else {
      router.push(`/my-account/${section}`);
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      if (!isAuthenticated()) {
        redirectToLogin(router, initialPathRef.current);
        return;
      }

      try {
        setLoadingUser(true);
        const res = await getCurrentUser(); // Fetch from backend
        if (res.success && res.data) {
          setCurrentUser(res.data);
        } else {
          // Handle error, maybe log out or show a message
          console.error("Failed to fetch user data:", res.message);
          redirectToLogin(router, initialPathRef.current); // Redirect to login on failure
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        redirectToLogin(router, initialPathRef.current); // Redirect to login on error
      } finally {
        setLoadingUser(false);
      }
    };

    fetchUserData();
  }, [router]);

  if (loadingUser) {
    // Show loading spinner while fetching user data
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white z-[9999]">
        <div
          className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#a97f0f]"
          role="status"
        >
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    // If loading finished but no user, redirect (should be handled by fetchUserData)
    return null;
  }

  return (
    <div className="dashboard-wrapper">
      {/* User Info Section */}
      <UserInfoCard user={currentUser} onSelectSection={onSelectSection} />

      <div className="row g-0 flex flex-col lg:flex-row mt-4">
        {/* Left Menu */}
        <DashboardSidebar activeSection={activeSection} />

        {/* Right Content */}
        <DashboardContent activeSection={activeSection} />
      </div>
    </div>
  );
};

export default UserDashboardLayout;
