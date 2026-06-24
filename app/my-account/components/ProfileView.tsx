"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { getCurrentUser } from "../../services/userService";
import { getApiImageUrl } from "../../services/api";

const ProfileView: React.FC = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [alternativeMobileNumber, setAlternativeMobileNumber] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");
  const [profilePictureUrl, setProfilePictureUrl] = useState("");

  const [initialLoading, setInitialLoading] = useState(true);
  const [initialError, setInitialError] = useState("");

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setInitialLoading(true);
        const res = await getCurrentUser();
        if (res.success && res.data) {
          const userDetails = res.data;
          setName(userDetails.name || "");
          setEmail(userDetails.email || "");
          setMobileNumber(userDetails.phoneNumber || "");
          setAlternativeMobileNumber(userDetails.alternativeMobileNumber || "");
          setDateOfBirth(
            userDetails.dateOfBirth
              ? new Date(userDetails.dateOfBirth).toISOString().split("T")[0]
              : "",
          );
          setGender(userDetails.gender || "");
          setProfilePictureUrl(getApiImageUrl(userDetails.profilePicture));
        } else {
          setInitialError("Failed to fetch user data.");
        }
      } catch (err: any) {
        setInitialError(
          err.message || "An error occurred while fetching user data.",
        );
      } finally {
        setInitialLoading(false);
      }
    };

    fetchUserData();
  }, []);

  if (initialLoading) {
    return (
      <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 lg:mx-0 lg:ml-20 lg:max-w-[640px] lg:px-0 text-sm">
        Loading user data...
      </div>
    );
  }

  if (initialError) {
    return (
      <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 lg:mx-0 lg:ml-20 lg:max-w-[640px] lg:px-0 text-sm text-red-500">
        {initialError}
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 lg:mx-0 lg:ml-20 lg:max-w-[640px] lg:px-0">
      {/* Header */}
      <div className="pb-4 border-b border-gray-200">
        <h3 className="text-xl font-bold">Profile Details</h3>
        <p className="text-sm">View your profile details</p>
      </div>

      {/* Content */}
      <div className="text-sm">
        {/* Profile Picture */}
        {profilePictureUrl && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 py-6 px-5 border border-gray-200 rounded-sm mt-3">
            <label className="sm:w-56 text-gray-700 font-semibold">
              Profile Picture
            </label>
            <div className="flex items-center space-x-4">
              <Image
                src={profilePictureUrl}
                alt="Profile"
                width={80}
                height={80}
                className="h-20 w-20 rounded-full object-cover"
              />
            </div>
          </div>
        )}

        {/* Mobile Number */}
        <div className="flex items-center justify-between py-6 px-5 border border-gray-200 hover:border-[#ac8037] rounded-sm mt-3">
          <div className="flex flex-col">
            <label className="text-gray-700 font-semibold mb-1">
              Mobile Number
            </label>
            <span className="text-gray-900 font-medium break-words">
              {mobileNumber || "-"}
            </span>
          </div>
        </div>

        {/* Email */}
        <div className="flex items-center justify-between py-6 px-5 border border-gray-200 hover:border-[#ac8037] rounded-sm mt-3">
          <div className="flex flex-col">
            <label className="text-gray-700 font-semibold mb-1">Email</label>
            <span className="text-gray-900 font-medium break-words">{email || "-"}</span>
          </div>
        </div>

        {/* Full Name */}
        <div className="flex items-center justify-between py-6 px-5 border border-gray-200 hover:border-[#ac8037] rounded-sm mt-3">
          <div className="flex flex-col">
            <label className="text-gray-700 font-semibold mb-1">
              Full Name
            </label>
            <span className="text-gray-900 font-medium break-words">{name || "-"}</span>
          </div>
        </div>

        {/* Gender */}
        <div className="flex items-center justify-between py-6 px-5 border border-gray-200 hover:border-[#ac8037] rounded-sm mt-3">
          <div className="flex flex-col">
            <label className="text-gray-700 font-semibold mb-1">Gender</label>
            <span className="text-gray-900 font-medium">{gender || "-"}</span>
          </div>
        </div>

        {/* Birthday */}
        <div className="flex items-center justify-between py-6 px-5 border border-gray-200 hover:border-[#ac8037] rounded-sm mt-3">
          <div className="flex flex-col">
            <label className="text-gray-700 font-semibold mb-1">Birthday</label>
            <span className="text-gray-900 font-medium">
              {dateOfBirth || "-"}
            </span>
          </div>
        </div>

        {/* Alternative Mobile */}
        {alternativeMobileNumber && (
          <div className="py-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-2">
              Alternative Contact
            </h4>
            <div className="flex items-center justify-between py-6 px-5 border border-gray-200 hover:border-[#ac8037] rounded-sm mt-3">
              <div className="flex flex-col">
                <label className="text-gray-700 font-semibold mb-1">
                  Mobile Number
                </label>
                <span className="text-gray-900 font-medium break-words">
                  {alternativeMobileNumber}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileView;