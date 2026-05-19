import React from "react";
import Link from "next/link";
import Footer from "./Footer";
import { API_BASE_URL } from "../services/api";

interface PolicyPageProps {
  slug: string;
}

interface PageData {
  title: string;
  content: string;
}

async function getPageData(slug: string): Promise<PageData | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/pages/slug/${slug}`, {
      cache: "no-store",
    });
    const json = await res.json();
    return json.success && json.page ? json.page : null;
  } catch {
    return null;
  }
}

const PolicyPage = async ({ slug }: PolicyPageProps) => {
  const data = await getPageData(slug);
  const title = data?.title || (slug === "terms-and-conditions" ? "Terms & Conditions" : "Privacy Policy");
  const htmlContent = data?.content || "<p>Page content is being updated. Please check back later.</p>";

  return (
    <>
      <div className="container-fluid p-0 relative overflow-hidden md:mt-[75px] mb-[45px] text-center">
        <div className="relative py-12 bg-[#f9f6f0] border-b border-[#e9e0d1]">
          <div className="max-w-4xl mx-auto px-4">
            <h1 className="font-optima text-[36px] text-[#6a3f07] font-normal tracking-wide">
              {title}
            </h1>
            <div className="text-[#a2690f] mt-3 font-[family-name:var(--font-montserrat)] text-sm tracking-widest uppercase">
              <Link href="/" className="hover:text-[#6a3f07] transition-colors">
                Home
              </Link>
              <span className="mx-3">/</span>
              <span>{title}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-20 max-w-4xl">
        <div 
          className="prose max-w-none policy-content font-[family-name:var(--font-montserrat)] text-sm md:text-base text-stone-800"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      </div>

      <Footer />
    </>
  );
};

export default PolicyPage;
