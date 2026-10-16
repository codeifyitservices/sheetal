"use client";

import React from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <div
          style={{
            display: "flex",
            minHeight: "100vh",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            fontFamily: "sans-serif",
            padding: "20px",
            textAlign: "center",
          }}
        >
          <h2 style={{ fontSize: "24px", marginBottom: "12px", color: "#111" }}>
            Something went wrong!
          </h2>
          <p style={{ color: "#666", marginBottom: "20px" }}>
            {error?.message || "An unexpected error occurred."}
          </p>
          <button
            onClick={() => reset()}
            style={{
              padding: "10px 24px",
              backgroundColor: "#8b6b2f",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
