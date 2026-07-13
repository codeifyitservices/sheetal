import { Metadata } from "next";
import Footer from "../components/Footer";
import Image from "next/image";
import Link from "next/link";
import { API_BASE_URL } from "../services/api";
import JsonLd from "../components/JsonLd";
import { getSeoSettings } from "../services/seoSettingsService";
import { buildPageSchema, parseSchemaString } from "../utils/schema";

interface SectionData {
  image?: string;
  title?: string;
  description?: string;
}

interface AboutData {
  banner?: SectionData;
  journey?: SectionData;
  mission?: SectionData;
  craft?: SectionData;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  ogImage?: string;
  canonicalUrl?: string;
  seoSchema?: string;
}

export async function generateMetadata(): Promise<Metadata> {
  const [data, seoSettings] = await Promise.all([
    getAboutPageData(),
    getSeoSettings(),
  ]);

  const title =
    data?.metaTitle || `About Us | ${seoSettings?.websiteName || "Studio By Sheetal"}`;
  const description =
    data?.metaDescription ||
    seoSettings?.organizationDescription ||
    "Learn more about Studio By Sheetal, our journey since 2017, our mission to provide quality ethnic wear, and the craftsmanship behind our sarees.";
  const canonical =
    data?.canonicalUrl ||
    `${seoSettings?.websiteUrl || "https://studiobysheetal.com"}/about-us`;

  return {
    title,
    description,
    keywords: data?.metaKeywords || "about studio by sheetal, sheetal by studio story, ethnic wear brand surat, craftsmanship, saree legacy",
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      images: data?.ogImage ? [{ url: data.ogImage, alt: title }] : [],
      type: "website",
    },
  };
}

async function getAboutPageData(): Promise<AboutData | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/pages/about`, {
      next: { revalidate: 300 },
    });
    const json = await res.json();
    return json.success && json.page ? json.page : null;
  } catch {
    return null;
  }
}

const AboutUs = async () => {
  const [data, seoSettings] = await Promise.all([
    getAboutPageData(),
    getSeoSettings(),
  ]);

  const getImage = (path: string | undefined, fallback: string): string =>
    path || fallback;

  const schema =
    parseSchemaString(data?.seoSchema) ||
    buildPageSchema(
      {
        title: data?.banner?.title || "About Us",
        slug: "about-us",
        content: data?.journey?.description || "",
        metaTitle: data?.metaTitle,
        metaDescription: data?.metaDescription,
        canonicalUrl: data?.canonicalUrl,
      },
      seoSettings,
    );

  return (
    <>
      <JsonLd data={schema} />
      <div className="container-fluid p-0 relative overflow-hidden md:mt-[75px] mb-[65px] text-center">
        <div className="relative">
          <div className="w-full">
            <Image
              src={getImage(data?.banner?.image, "/assets/702327597.jpg")}
              alt="Our Story Banner"
              width={1920}
              height={600}
              className="w-full h-[480px] object-cover"
              priority
            />
          </div>
          <div
            id="our-story"
            className="w-full scroll-mt-20 border-b border-[#ffcf8c] pb-2 bg-white/80 md:bg-transparent py-5"
          >
            <h1 className="font-optima text-[30px] text-[#6a3f07] font-normal">
              {data?.banner?.title || "Our Story"}
            </h1>
            <div className="text-[#6a3f07]">
              <ul className="inline-block p-0 m-0">
                <li className="inline-block mx-3 relative md:text-[15px]">
                  <Link href="/" className="text-[#6a3f07] hover:text-[#9c6000]">
                    Home
                  </Link>
                  <span className="absolute -right-[19px] top-0">/</span>
                </li>
                <li className="inline-block mx-3 relative md:text-[15px]">
                  {data?.banner?.title || "Our Story"}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-12 relative">
        <div className="flex flex-wrap items-center">
          <div className="w-full lg:w-1/3 mb-10 lg:mb-0">
            <div className="relative text-right md:mb-20">
              <Image
                src={getImage(data?.journey?.image, "/assets/491400216.png")}
                alt="Founder"
                width={500}
                height={600}
                className="inline-block max-w-full w-auto h-120 md:h-150 md:w-125 "
              />
              <Image
                src="/assets/roud-img.png"
                alt="Decoration"
                width={150}
                height={150}
                className="absolute -bottom-1 right-0 md:-right-16 animate-spin"
                style={{ animationDuration: "6s" }}
              />
            </div>
          </div>
          <div className="w-full lg:w-2/3 pl-0 ">
            <div className="w-[90%] md:w-[96%] mx-auto lg:mx-0 lg:ml-[12%] lg:pr-10 text-center lg:text-left">
              <h2 className="font-optima text-[#6a3f07] relative inline-block before:hidden after:hidden md:before:block md:after:block md:before:content-[''] md:before:w-[60px] md:before:h-[2px] md:before:bg-[#a2690f] md:before:absolute md:before:-left-[85px] md:before:top-1/2 md:after:content-[''] md:after:w-[60px] md:after:h-[2px] md:after:bg-[#a2690f] md:after:absolute md:after:-right-[85px] md:after:top-1/2">
                {data?.journey?.title || "Our Journey"}
              </h2>
              <div className="text-[15px] font-[family-name:var(--font-montserrat)] text-black leading-relaxed space-y-4 whitespace-pre-wrap">
                {data?.journey?.description ? (
                  <p>{data.journey.description}</p>
                ) : (
                  <>
                    <p>
                      Studio By Sheetal isn&apos;t just a name - it&apos;s a feeling woven
                      into every saree we create. SBS represents the joy of
                      draping tradition, the pride of cultural identity, and the
                      grace of timeless elegance.
                    </p>
                    <p>
                      Founded in 2017 in Surat&apos;s vibrant Vankar Textile Market,
                      Studio By Sheetal began as a humble 160 sq. ft. shop. This
                      powerful blend laid the foundation for a brand that would
                      soon change the ethnicwear landscape.
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container-fluid bg-[#f3f5ed] md:py-12 md:bg-white md:py-0">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap">
            <div className="w-full text-center md:mb-8">
              <Image
                src={getImage(data?.mission?.image, "/assets/343965253.jpg")}
                alt="Growth Story"
                width={960}
                height={640}
                className="rounded-[20px] md:rounded-[50px] inline-block h-auto w-auto max-w-full"
              />
            </div>
            <div className="w-full">
              <div className="text-center px-4 md:px-8 py-8 md:py-12">
                <h2 className="font-optima text-[#593300] mb-8 font-normal">
                  {data?.mission?.title ||
                    "Custom handpicked styles showcased by our founder, experience the quality"}
                </h2>
                <div className="mx-auto max-w-4xl text-[15px] font-[family-name:var(--font-montserrat)] text-black leading-relaxed space-y-4 whitespace-pre-wrap">
                  {data?.mission?.description ? (
                    <p>{data.mission.description}</p>
                  ) : (
                    <>
                      <p>
                        Starting with local saree sales in 2017, Studio By
                        Sheetal quickly gained a reputation for lightweight,
                        stylish designs and smart pricing. Within 6 months, we
                        tripled our sales and expanded into a larger space,
                        setting the pace for rapid growth. By 2018, we supplied
                        local resellers and dealers across India&apos;s textile hubs.
                        In just two years, Studio By Sheetal scaled 5X,
                        culminating in a significant breakthrough in 2019 by
                        launching on India&apos;s top fashion marketplaces including
                        Myntra, Tata Cliq, Nykaa, and Ajio. This digital entry
                        rocketed our sales 10X.
                      </p>
                      <p>
                        Even during the challenging pandemic years, Studio By
                        Sheetal defied industry trends with continuous scaling,
                        thanks to the founders&apos; combined experience and a focus
                        on unique, exclusive products and organic lead
                        generation in India&apos;s offline textile markets
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container-fluid bg-white pb-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center">
            <div className="w-full lg:w-1/2 text-center mb-8 lg:mb-0">
              <Image
                src={getImage(data?.craft?.image, "/assets/934222427.jpg")}
                alt="Craftsmanship"
                width={600}
                height={600}
                className="rounded-[20px] md:rounded-[50px] inline-block h-auto w-auto max-w-full"
              />
            </div>
            <div className="w-full lg:w-1/2 text-center lg:text-left pl-0 lg:pl-12">
              <div className="px-4 md:px-0">
                <h2 className="font-optima text-[#593300] mb-4 md:mb-8 font-normal">
                  {data?.craft?.title || "Craftsmanship At The Core"}
                </h2>
                <div className="mx-auto lg:mx-0 text-[15px] font-[family-name:var(--font-montserrat)] text-black leading-relaxed whitespace-pre-wrap">
                  {data?.craft?.description ? (
                    <p>{data.craft.description}</p>
                  ) : (
                    <p>
                      Our sarees are more than fabric - they are stories crafted
                      by skilled artisans and weavers from all across India. We
                      honor and preserve their ancestral techniques, patience,
                      and passion, blending age-old craftsmanship with modern
                      aesthetics. Each saree carries the legacy of generations,
                      made lightweight, shrink-resistant, and finished to
                      perfection - all at an affordable price point.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default AboutUs;
