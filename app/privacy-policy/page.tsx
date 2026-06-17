import React from "react";
import PolicyPage, { getPolicyMetadata } from "../components/PolicyPage";

export async function generateMetadata() {
  return getPolicyMetadata("privacy-policy");
}

export default function PrivacyPolicyPage() {
  return <PolicyPage slug="privacy-policy" />;
}
