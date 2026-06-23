import Link from "next/link";
import Footer from "./Footer";
import JsonLd from "./JsonLd";
import StaticPageContentClient from "./StaticPageContentClient";
import { getSeoSettings } from "../services/seoSettingsService";
import type { StaticPage as StaticPageData } from "../services/staticPageService";
import { buildPageSchema, parseSchemaString } from "../utils/schema";

export default async function StaticPage({ page }: { page: StaticPageData }) {
  const seoSettings = await getSeoSettings();
  const schema =
    parseSchemaString(page.seoSchema) || buildPageSchema(page, seoSettings);

  return (
    <>
      <JsonLd data={schema} />
      <div className="container-fluid p-0 relative overflow-hidden md:mt-[75px] mb-[45px] text-center">
        <div className="relative py-12 bg-[#f9f6f0] border-b border-[#e9e0d1]">
          <div className="max-w-4xl mx-auto px-4">
            <h1 className="font-optima text-[36px] text-[#6a3f07] font-normal tracking-wide">
              {page.title}
            </h1>
            <div className="text-[#a2690f] mt-3 font-[family-name:var(--font-montserrat)] text-sm tracking-widest uppercase">
              <Link href="/" className="hover:text-[#6a3f07] transition-colors">
                Home
              </Link>
              <span className="mx-3">/</span>
              <span>{page.title}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-20 max-w-4xl">
        <div className="static-page-content prose max-w-none font-[family-name:var(--font-montserrat)] text-sm md:text-base text-stone-800">
          <StaticPageContentClient slug={page.slug} initialPage={page} />
        </div>
      </div>

      <Footer />
    </>
  );
}
