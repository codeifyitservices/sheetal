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

  // Handle navigation from UserInfoCard
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
    <main className="container relative mt-30 mx-auto px-4 lg:px-0 mb-40 w-full font-[family-name:var(--font-montserrat)] flex justify-center items-center">
        <div className="dashboard-wrapper">
          <UserInfoCard user={currentUser} onSelectSection={onSelectSection} />

          <div className="row g-0 flex flex-col lg:flex-row mt-4">
            <DashboardSidebar activeSection={activeSection} />

            <div className="col-lg-8">
              <div className="">{children}</div>
            </div>
          </div>
        </div>
      </main>
  );
};

export default MyAccountLayout;
