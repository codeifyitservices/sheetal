"use client";

import React, { useEffect, useState } from "react";
import { API_BASE_URL } from "../../services/api";

const TermsPage = () => {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/pages/slug/terms-and-conditions`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.page) {
          setContent(data.page.content);
        }
      })
      .catch((err) => console.error("Error loading terms and conditions", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="ml-20 w-160 max-w-full">
      <h4 className="text-2xl font-semibold text-gray-800 mb-2">
        Terms of Use
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
          className="prose max-w-none policy-account-content text-sm text-gray-700"
          dangerouslySetInnerHTML={{ __html: content || "<p>No content available.</p>" }}
        />
      )}
    </div>
  );
};

export default TermsPage;
