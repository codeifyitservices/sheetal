import PolicyPage, { getPolicyMetadata } from "../components/PolicyPage";

export async function generateMetadata() {
  return getPolicyMetadata("return-exchange-policy");
}

export default function LegacyReturnPolicyPage() {
  return <PolicyPage slug="return-exchange-policy" />;
}
