import React from "react";
import PolicyPage, { getPolicyMetadata } from "../components/PolicyPage";

export async function generateMetadata() {
  return getPolicyMetadata("return-exchange-policy");
}

export default function ReturnExchangePolicyPage() {
  return <PolicyPage slug="return-exchange-policy" />;
}
