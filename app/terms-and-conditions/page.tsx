import PolicyPage, { getPolicyMetadata } from "../components/PolicyPage";

export async function generateMetadata() {
  return getPolicyMetadata("terms-and-conditions");
}

export default function TermsAndConditionsPage() {
  return <PolicyPage slug="terms-and-conditions" />;
}
