"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import UserInfoCard from "./components/UserInfoCard";
import DashboardSidebar from "./components/DashboardSidebar";
import { isAuthenticated } from "../services/authService";
import { getCurrentUser } from "../services/userService";
import { redirectToLogin } from "../utils/authRedirect";

interface CurrentUser {
  name?: string;
  phoneNumber?: string;
  email?: string;
  [key: string]: unknown;
}

const MyAccountLayout = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const pathname = usePathname();
  const initialPathRef = useRef(pathname);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const getActiveSectionFromPath = (path: string): string => {
    const parts = path.split("/").filter(Boolean);
    if (parts.length === 1 && parts[0] === "my-account") return "overview";
    if (parts.includes("profile") && parts.includes("edit"))
      return "edit-profile";
    if (parts.length >= 2 && parts[0] === "my-account") return parts[1];
    return "overview";
  };

  const activeSection = getActiveSectionFromPath(pathname);

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!isAuthenticated()) {
        redirectToLogin(router, initialPathRef.current);
        return;
      }

      try {
        setLoadingUser(true);
        const res = await getCurrentUser();
        if (res.success && res.data) {
          setCurrentUser(res.data);
        } else {
          console.error("Failed to fetch user data:", res.message);
          redirectToLogin(router, initialPathRef.current);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        redirectToLogin(router, initialPathRef.current);
      } finally {
        setLoadingUser(false);
      }
    };

    fetchUserData();
  }, [router]);

  const onSelectSection = (section: string) => {
    setSidebarOpen(false);
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

  if (loadingUser) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white z-[9999]">
        <div
          className="animate-spin rounded-full h-12 w-12 border-4 border-solid border-[#a97f0f] border-t-transparent"
          role="status"
        ></div>
      </div>
    );
  }

  if (!isAuthenticated()) {
    return null;
  }

  return (
    <main className="container relative mt-20 lg:mt-30 mx-auto px-4 mb-16 lg:mb-40 w-full font-[family-name:var(--font-montserrat)]">
      <div className="w-full max-w-5xl mx-auto">
        <UserInfoCard user={currentUser} onSelectSection={onSelectSection} />

        {/* Mobile hamburger bar */}
        <div className="flex lg:hidden items-center mt-4 mb-2">
          <button
            onClick={() => setSidebarOpen((prev) => !prev)}
            className="flex flex-col justify-center items-center w-9 h-9 rounded-md border border-gray-200 bg-white shadow-sm gap-[5px] px-2"
            aria-label="Toggle menu"
            aria-expanded={sidebarOpen}
          >
            <span
              className={`block h-[2px] w-5 bg-gray-700 rounded transition-all duration-300 ${
                sidebarOpen ? "rotate-45 translate-y-[7px]" : ""
              }`}
            />
            <span
              className={`block h-[2px] w-5 bg-gray-700 rounded transition-all duration-300 ${
                sidebarOpen ? "opacity-0" : ""
              }`}
            />
            <span
              className={`block h-[2px] w-5 bg-gray-700 rounded transition-all duration-300 ${
                sidebarOpen ? "-rotate-45 -translate-y-[7px]" : ""
              }`}
            />
          </button>
          <span className="ml-3 text-sm font-medium text-gray-600">Menu</span>
        </div>

        <div className="flex flex-col lg:flex-row mt-0 lg:mt-4 gap-4">
          {/* Sidebar — slides down on mobile, always visible on desktop */}
          <div
            className={`lg:block transition-all duration-300 ease-in-out overflow-hidden ${
              sidebarOpen
                ? "max-h-[600px] opacity-100"
                : "max-h-0 opacity-0 lg:max-h-none lg:opacity-100"
            }`}
          >
            <DashboardSidebar
              activeSection={activeSection}
              onSelectSection={onSelectSection}
            />
          </div>

          <div className="flex-1 min-w-0">
            <div>{children}</div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default MyAccountLayout;
