import FAQPage, { getFaqMetadata } from "../components/FAQPage";

export async function generateMetadata() {
  return getFaqMetadata();
}

export default function FAQ() {
  return <FAQPage />;
}
