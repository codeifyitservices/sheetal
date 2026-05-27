"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Category,
  fetchCategoryBySlug,
  getCategoryBannerUrl,
} from "../../services/categoryService";
import { searchService } from "../../services/searchService";

interface ProductListBannerProps {
  categorySlug?: string;
  searchQuery?: string | null;
}

const ProductListBanner: React.FC<ProductListBannerProps> = ({
  categorySlug,
  searchQuery,
}) => {
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(!!categorySlug || !!searchQuery?.trim());
  const [error, setError] = useState<string | null>(null);

  const handleScroll = (id: string) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  useEffect(() => {
    const loadBannerCategory = async () => {
      const trimmedSearchQuery = searchQuery?.trim();
      if (!categorySlug && !trimmedSearchQuery) {
        return;
      }

      try {
        setLoading(true);
        setError(null);
        setCategory(null);

        if (categorySlug) {
          const data = await fetchCategoryBySlug(categorySlug);
          if (!data) {
            setError("Category not found");
          } else {
            setCategory(data);
          }
          return;
        }

        if (!trimmedSearchQuery) {
          return;
        }

        const searchResponse = await searchService(trimmedSearchQuery);
        const matchedCategory = searchResponse?.results?.find(
          (result: any) => result.type === "category" && result.data?.slug,
        )?.data;

        if (!matchedCategory?.slug) {
          return;
        }

        const matchedCategoryData = await fetchCategoryBySlug(matchedCategory.slug);
        if (matchedCategoryData) {
          setCategory(matchedCategoryData);
        } else {
          setCategory({
            _id: matchedCategory._id || matchedCategory.slug,
            name: matchedCategory.name,
            slug: matchedCategory.slug,
          } as Category);
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to load category";
        setError(errorMessage);
        console.error("Error loading category:", err);
      } finally {
        setLoading(false);
        setTimeout(() => handleScroll("category-scroll"), 100);
      }
    };

    loadBannerCategory();
  }, [categorySlug, searchQuery]);

  // Use category data if available, otherwise fallback to defaults
  const trimmedSearchQuery = searchQuery?.trim();
  const isSearchPage = !categorySlug && !!trimmedSearchQuery;
  const bannertext = isSearchPage
    ? `Showing results for: ${trimmedSearchQuery}`
    : category?.categoryBanner || "";
  const title = isSearchPage
    ? category?.name || trimmedSearchQuery
    : category?.name || "Collection";
  const description =
    (isSearchPage
      ? `Browse products matching "${trimmedSearchQuery}" and refine the results using filters and sorting.`
      : category?.description) ||
    `Explore our exclusive ${title.toLowerCase()} collection. Get styled with the high-fashion products and transform yourself.`;
  const bannerImage = getCategoryBannerUrl(category || undefined);

  if (loading) {
    return (
      <div>
        <div className="relative w-full h-[60vh] md:h-[95vh] overflow-hidden mt-[40px] md:mt-[75px] bg-gray-200 animate-pulse" />
        <div className="flex flex-col items-center justify-center text-[#694708] mt-10 h-20" />
      </div>
    );
  }

  return (
    <>
      {/* Breadcrumb / Banner Section */}
      <div className="relative w-full h-[60vh] md:h-[95vh] overflow-hidden mt-[40px] md:mt-[75px]">
        <Image
          src={bannerImage}
          alt={title}
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        {/* Logo Overlay */}
        {/* <div className="absolute inset-0 z-10 flex items-start py-10 justify-center pointer-events-none">
          <Link href="/" className="pointer-events-auto">
            <Image
              src="/assets/625030871.png"
              alt="Studio By Sheetal"
              width={300}
              height={100}
              className="w-auto h-[160px] md:h-[260px]"
            />
          </Link>
        </div> */}
      </div>

      <div
        id="category-scroll"
        className="scroll-mt-30 flex flex-col items-center justify-center text-[#694708] mt-10 pb-6 border-b border-[#ffcf8c]"
      >
        <h1 className="text-4xl md:text-[35px] text-[#6a3f07] font-light mb-2 font-[family-name:var(--font-optima)] tracking-normal">
          {title}
        </h1>
        <nav className="text-[15px] font-[family-name:var(--font-montserrat)] font-extralight tracking-widest flex items-center gap-3 text-[#6a3f07]">
          <Link href="/">Home</Link>
          <span className="text-[#6a3f07]">/</span>
          <span className="">{title}</span>
        </nav>
      </div>
      

      {/* Category Description */}
      <div className="container mx-auto px-4 pt-16">
        <div className="text-center mb-8 max-w-3xl mx-auto">
          <div className="flex items-center gap-8 justify-center">
            <div className="w-20 h-px bg-[#bd9951]"></div>
            <h2 className="font-light text-[#6a3f07] font-[family-name:var(--font-optima)]">
              {bannertext}
            </h2>
            <div className="w-20 h-px bg-[#bd9951]"></div>
          </div>
          <p className="text-black font-light text-[15px] font-[family-name:var(--font-montserrat)] tracking-wide">
            {description}
          </p>
        </div>
      </div>
    </>
  );
};

export default ProductListBanner;
