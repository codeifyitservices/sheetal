import React from "react";
import PolicyPage, { getPolicyMetadata } from "../components/PolicyPage";

export async function generateMetadata() {
  return getPolicyMetadata("terms-and-conditions");
}

export default function TermsConditionsPage() {
  return <PolicyPage slug="terms-and-conditions" />;
}
