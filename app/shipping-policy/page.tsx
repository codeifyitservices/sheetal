import React from "react";
import PolicyPage, { getPolicyMetadata } from "../components/PolicyPage";

export async function generateMetadata() {
  return getPolicyMetadata("shipping-policy");
}

export default function ShippingPolicyPage() {
  return <PolicyPage slug="shipping-policy" />;
}
