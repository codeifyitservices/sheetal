"use client";

import React, { useEffect, useState } from "react";
import { API_BASE_URL } from "../../services/api";

const PrivacyPage = () => {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/pages/slug/privacy-policy`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.page) {
          setContent(data.page.content);
        }
      })
      .catch((err) => console.error("Error loading privacy policy", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 lg:mx-0 lg:ml-20 lg:max-w-[640px] lg:px-0">
      <h4 className="text-2xl font-semibold text-gray-800 mb-2">
        Privacy Center
      </h4>
      <hr className="mb-6 border-gray-200" />
      {loading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
      ) : (
        <div 
          className="prose prose-sm sm:prose max-w-none policy-account-content text-sm text-gray-700 break-words"
          dangerouslySetInnerHTML={{ __html: content || "<p>No content available.</p>" }}
        />
      )}
    </div>
  );
};

export default PrivacyPage;