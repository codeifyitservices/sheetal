"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { searchService } from "@/app/services/searchService";
import {
  fetchProducts,
  Product,
  getProductImageUrl,
  getProductHoverImageUrl,
} from "../services/productService";
import { getCategoryImageUrl } from "../services/categoryService";
import { useCategories } from "../hooks/useCategories";
import Image from "next/image";
import { buildProductHref } from "../utils/productRoutes";

const PREVIOUS_SEARCHES_KEY = "previous_searches";
const MAX_PREVIOUS_SEARCHES = 5;

interface PreviousSearchItem {
  type: "product" | "category" | "query";
  name: string;
  slug?: string;
  categoryName?: string;
  categorySlug?: string;
}

const getPreviousSearches = (): PreviousSearchItem[] => {
  if (typeof window === "undefined") return [];
  const searches = localStorage.getItem(PREVIOUS_SEARCHES_KEY);
  return searches ? JSON.parse(searches) : [];
};

const addClickedItem = (item: PreviousSearchItem) => {
  if (typeof window === "undefined") return;
  const items = getPreviousSearches();
  const identifier =
    item.type === "product"
      ? `product-${item.slug}`
      : item.type === "category"
        ? `category-${item.categoryName}`
        : `query-${item.name.toLowerCase().trim()}`;
  const updatedItems = [
    item,
    ...items.filter((existingItem) => {
      const existingIdentifier =
        existingItem.type === "product"
          ? `product-${existingItem.slug}`
          : existingItem.type === "category"
            ? `category-${existingItem.categoryName}`
            : `query-${existingItem.name.toLowerCase().trim()}`;
      return existingIdentifier !== identifier;
    }),
  ].slice(0, MAX_PREVIOUS_SEARCHES);
  localStorage.setItem(PREVIOUS_SEARCHES_KEY, JSON.stringify(updatedItems));
};

const addSearchQuery = (queryText: string) => {
  const trimmed = queryText.trim();
  if (!trimmed) return;
  addClickedItem({ type: "query", name: trimmed });
};

const getSearchResultsHref = (queryText: string) =>
  `/product-list?search=${encodeURIComponent(queryText.trim())}`;

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  navbarBottom?: number;
}

const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  navbarBottom = 63,
}) => {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [previousSearches, setPreviousSearches] = useState<
    PreviousSearchItem[]
  >([]);
  const [trendingProducts, setTrendingProducts] = useState<Product[]>([]);

  // ── Mobile detection ──
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const inputRef = useRef<HTMLInputElement>(null);

  const { categories: allCategories } = useCategories();
  const trendingCategories = allCategories
    .filter((c) => !c.parentCategory)
    .slice(0, 8);
  const normalizeCategoryResult = useCallback(
    (result: any) => {
      if (result?.type !== "category" || !result?.data) return result;

      const matchedCategory = allCategories.find(
        (category) =>
          category._id === result.data._id ||
          category.slug === result.data.slug ||
          category.name.toLowerCase() === result.data.name?.toLowerCase(),
      );

      if (!matchedCategory) {
        return result;
      }

      return {
        ...result,
        data: {
          ...matchedCategory,
          ...result.data,
          mainImage: result.data.mainImage || matchedCategory.mainImage,
          image: result.data.image || matchedCategory.image,
        },
      };
    },
    [allCategories],
  );

  useEffect(() => {
    if (isOpen) {
      setPreviousSearches(getPreviousSearches());
      setTimeout(() => inputRef.current?.focus(), 100);
      if (trendingProducts.length === 0) {
        fetchProducts({ sort: "-viewCount", limit: 4, status: "Active" })
          .then((prodRes) => {
            if (prodRes.success && prodRes.products) {
              setTrendingProducts(
                prodRes.products.filter(
                  (product) =>
                    Boolean(
                      product &&
                        product._id &&
                        product.slug &&
                        product.name &&
                        product.status === "Active",
                    ),
                ),
              );
            }
          })
          .catch((err) =>
            console.error("Failed to load trending products", err),
          );
      }
    } else {
      setQuery("");
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (query.length >= 1) {
      const debounce = setTimeout(() => {
        setIsLoading(true);
        searchService(query)
          .then(async (res) => {
            const rawResults: any[] = res.results;
            const categoryResults = rawResults
              .filter((r) => r.type === "category")
              .map(normalizeCategoryResult);
            const productResults = rawResults.filter(
              (r) => r.type === "product",
            );
            const visibleProductResults = productResults.filter(
              (r) =>
                Boolean(
                  r.data &&
                    r.data._id &&
                    r.data.slug &&
                    r.data.name &&
                    r.data.status === "Active",
                ),
            );

            if (visibleProductResults.length === 0) {
              setResults(categoryResults);
              return;
            }

            const ids = visibleProductResults
              .map((r) => r.data._id ?? r.data.id)
              .filter(Boolean)
              .join(",");

            const fullRes = await fetchProducts({
              ids,
              limit: visibleProductResults.length,
              status: "Active",
            });

            if (fullRes.success && fullRes.products?.length) {
              const fullProductMap = new Map<string, Product>(
                fullRes.products
                  .filter(
                    (p: Product) =>
                      Boolean(p && p._id && p.slug && p.name && p.status === "Active"),
                  )
                  .map((p: Product) => [p._id, p]),
              );
              const enrichedProductResults = visibleProductResults.map((r) => ({
                ...r,
                data: fullProductMap.get(r.data._id ?? r.data.id) ?? r.data,
              }));
              setResults([...categoryResults, ...enrichedProductResults]);
            } else {
              setResults([...categoryResults, ...visibleProductResults]);
            }
          })
          .catch((err) => console.error(err))
          .finally(() => setIsLoading(false));
      }, 500);
      return () => clearTimeout(debounce);
    } else {
      setResults([]);
    }
  }, [normalizeCategoryResult, query]);

  const matchedCategories = results.filter((r) => r.type === "category");
  const matchedProducts = results.filter((r) => r.type === "product");

  const handleSearchSubmit = useCallback(() => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;
    addSearchQuery(trimmedQuery);
    setPreviousSearches(getPreviousSearches());
    onClose();
    router.push(getSearchResultsHref(trimmedQuery));
  }, [onClose, query, router]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const getPriceDisplay = (product: any) => {
    let minPrice = Infinity;
    let relatedMrp = 0;
    let discount = 0;

    if (product.minPrice !== undefined) {
      minPrice = product.minPrice;
      relatedMrp = product.mrp || 0;
      discount = product.discount || 0;
    } else if (product.variants && product.variants.length > 0) {
      product.variants.forEach((v: any) => {
        v.sizes?.forEach((s: any) => {
          const effective =
            s.discountPrice && s.discountPrice > 0 ? s.discountPrice : s.price;
          if (effective > 0 && effective < minPrice) {
            minPrice = effective;
            relatedMrp = s.price;
          }
        });
      });
      if (minPrice !== Infinity && relatedMrp > minPrice) {
        discount = Math.round(((relatedMrp - minPrice) / relatedMrp) * 100);
      }
    }

    if (minPrice === Infinity || minPrice === 0) return null;

    return (
      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
        <span className="font-semibold text-gray-900 text-[13px]">
          ₹{minPrice}
        </span>
        {relatedMrp > minPrice && (
          <>
            <span className="line-through text-[13px] text-gray-400">
              ₹{relatedMrp}
            </span>
            <span className="text-[13px] text-[#B78D65] font-semibold">
              {discount}% OFF
            </span>
          </>
        )}
      </div>
    );
  };

  const renderLeftPanelContent = () => {
    const showingQuery = query.length >= 1;

    return (
      <>
        {/* ── Inline suggestions ── */}
        {showingQuery && results.length > 0 && (
          <div className="mb-4 pb-3 border-b border-gray-100">
            <h4 className="text-[13px] font-semibold text-gray-800 tracking-wide mb-2">
              Suggestions:
            </h4>
            <div className="flex flex-col gap-0.5">
              {results.slice(0, 6).map((item, index) => (
                <Link
                  key={index}
                  href={
                    item.type === "category"
                      ? `/${item.data.slug}`
                      : buildProductHref(item.data)
                  }
                  onClick={() => {
                    addClickedItem(
                      item.type === "category"
                        ? {
                            type: "category",
                            name: item.data.name,
                            categoryName: item.data.name,
                          }
                        : {
                            type: "product",
                            name: item.data.name,
                            slug: item.data.slug,
                            categorySlug: item.data.category?.slug,
                          },
                    );
                    onClose();
                  }}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 transition-colors group"
                >
                  <span className="text-gray-400 group-hover:text-[#8c7e4e] transition-colors shrink-0">
                    {item.type === "category" ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect x="3" y="3" width="7" height="7" />
                        <rect x="14" y="3" width="7" height="7" />
                        <rect x="14" y="14" width="7" height="7" />
                        <rect x="3" y="14" width="7" height="7" />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
                    )}
                  </span>
                  <span className="text-[16px] text-gray-700 group-hover:text-[#4a3f1a] font-medium transition-colors truncate">
                    {item.data.name}
                  </span>
                  <span className="ml-auto text-[11px] text-gray-400 capitalize shrink-0">
                    {item.type}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── Popular Searches ── */}
        {trendingCategories.length > 0 && (
          <div className="mb-5">
            <h4 className="text-[16px] text-black tracking-wide mb-0.5">
              Popular Searches:
            </h4>
            <p className="text-[15px] text-gray-400 pb-2.5 border-b">
              10,000+ of the products are in our store
            </p>
            <div className="flex flex-wrap gap-4 mt-2.5">
              {trendingCategories.map((cat, i) => (
                <Link
                  key={i}
                  href={`/${cat.slug}`}
                  onClick={onClose}
                  className="text-[#8c7e4e] hover:text-[#4a3f1a] border py-2 px-3 md:p-0 rounded-md md:border-none md:underline underline-offset-2 text-[13px] md:text-[15px] transition-colors"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        {trendingCategories.length > 0 && previousSearches.length > 0 && (
          <hr className="border-gray-200 mb-3" />
        )}

        {/* ── Search History ── */}
        {previousSearches.length > 0 && (
          <div>
            <h4 className="text-[16px] text-black tracking-wide mb-0.5">
              Search History:
            </h4>
            <p className="text-[15px] text-gray-400 pb-2.5 border-b">
              you searched below keywords in the last session
            </p>
            <div className="flex flex-wrap gap-4 mt-2.5">
              {previousSearches.map((item, i) => {
                if (item.type === "query") {
                  return (
                    <button
                      key={i}
                      onClick={() => setQuery(item.name)}
                      className="flex items-center gap-1 text-[#8c7e4e] hover:text-[#4a3f1a] border md:p-0 py-2 px-3 rounded-md md:border-none md:underline underline-offset-2 text-[13px] md:text-[15px] transition-colors"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="11"
                        height="11"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="opacity-60 shrink-0"
                      >
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
                      {item.name}
                    </button>
                  );
                }
                return (
                  <Link
                    key={i}
                    href={
                      item.type === "product"
                        ? buildProductHref({
                            slug: item.slug,
                            categorySlug: item.categorySlug,
                          })
                        : `/product-list?category=${encodeURIComponent(item.categoryName || "")}`
                    }
                    onClick={() => {
                      addClickedItem(item);
                      onClose();
                    }}
                    className="text-[#8c7e4e] hover:text-[#4a3f1a] border py-2 px-3 md:p-0 rounded-md md:border-none md:underline underline-offset-2 text-[13px] md:text-[15px] transition-colors"
                  >
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </>
    );
  };

  const renderLeftPanel = () => (
    <div className="hidden md:block w-[300px] shrink-0 border-r border-gray-100 pr-5 overflow-y-auto max-h-[58vh] custom-scrollbar">
      {renderLeftPanelContent()}
    </div>
  );

  const renderMobilePanel = () => {
    const showingQuery = query.length >= 1;
    const hasContent =
      (showingQuery && results.length > 0) ||
      trendingCategories.length > 0 ||
      previousSearches.length > 0;
    if (!hasContent) return null;
    return <div className="md:hidden mb-4">{renderLeftPanelContent()}</div>;
  };

  const renderCategoryGrid = (cats: any[]) => (
    <div className="flex-1 min-w-0 mt-8">
      <div className="flex items-center gap-3 mb-4">
        <h4 className="text-[16px] font-normal text-black tracking-wide whitespace-nowrap">
          Collections:
        </h4>
        <hr className="flex-1 border-gray-200" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {cats.slice(0, 4).map((cat) => (
          <div
            key={cat._id}
            className="relative aspect-[3/4] rounded-lg overflow-hidden group"
          >
            <Link
              href={`/product-list?category=${cat.slug}`}
              className="block h-full w-full"
              onClick={() => {
                addClickedItem({
                  type: "category",
                  name: cat.name,
                  categoryName: cat.name,
                });
                onClose();
              }}
            >
              <Image
                src={getCategoryImageUrl(cat, "/assets/default-image.png")}
                alt={cat.name}
                fill
                className="object-cover w-full h-full"
              />
            </Link>
            <Link
              href={`/product-list?category=${cat.slug}`}
              className="absolute bottom-0 left-0 w-full text-center text-white text-[16px] bg-gradient-to-t from-[#251d05] to-transparent pt-[60px] pb-[15px] transition-all duration-300 pointer-events-auto"
              onClick={() => {
                addClickedItem({
                  type: "category",
                  name: cat.name,
                  categoryName: cat.name,
                });
                onClose();
              }}
            >
              <span className="inline-block group-hover:text-[#ffc107] group-hover:-translate-y-1.5 transition-transform duration-300 font-medium">
                {cat.name}
              </span>
            </Link>
          </div>
        ))}
      </div>

      <div className="mt-8 flex justify-center">
        <Link
          href="/product-list"
          onClick={onClose}
          className="inline-block border border-black text-black px-6 py-2.5 text-[12px] uppercase tracking-[0.15em] font-medium transition-colors duration-300 rounded-[2px]"
        >
          VIEW ALL COLLECTIONS
        </Link>
      </div>
    </div>
  );

  const renderProductGrid = (
    products: any[],
    isRaw: boolean,
    title: string,
  ) => (
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-3 mb-4">
        <h4 className="text-[16px] font-normal text-black tracking-wide whitespace-nowrap">
          {title}
        </h4>
        <hr className="flex-1 border-gray-200" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {products.map((item) => {
          const product = isRaw ? item : item.data;
          const imageUrl = isRaw
            ? getProductImageUrl(item)
            : getProductImageUrl(item.data);
          return (
            <Link
              key={product._id}
              href={buildProductHref(product)}
              className="group flex flex-col h-full cursor-pointer"
              onClick={() => {
                addClickedItem({
                  type: "product",
                  name: product.name,
                  slug: product.slug,
                  categorySlug: product.category?.slug,
                });
                onClose();
              }}
            >
              <div className="relative aspect-[3/4] bg-gray-50 rounded-2xl overflow-hidden shrink-0">
                <Image
                  src={imageUrl}
                  alt={product.name}
                  fill
                  className="object-cover opacity-100"
                />
              </div>
              <div className="mt-2 px-0.5 flex flex-col flex-grow">
                <h5 className="text-[15px] text-gray-800 font-medium line-clamp-2 leading-snug min-h-[36px]">
                  {product.name}
                </h5>
                <div className="mt-auto flex flex-col items-start">
                  {getPriceDisplay(product)}
                  <span className="inline-block mt-1.5 border-b border-black text-[12px] text-black uppercase tracking-wide transition-all duration-300 group-hover:tracking-widest group-hover:text-[#b3a660]">
                    View Detail
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {showingQuery && (
        <div className="mt-8 flex justify-center">
          <Link
            href={getSearchResultsHref(query)}
            onClick={() => {
              addClickedItem({ type: "query", name: query });
              addSearchQuery(query);
              onClose();
            }}
            className="inline-block border border-black text-black px-6 py-2.5 text-[12px] uppercase tracking-[0.15em] font-medium transition-colors duration-300 rounded-[2px]"
          >
            View all results for &ldquo;{query}&rdquo;
          </Link>
        </div>
      )}
    </div>
  );

  const renderProductsLoader = (title: string) => (
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-3 mb-4">
        <h4 className="text-[16px] font-normal text-black tracking-wide whitespace-nowrap">
          {title}
        </h4>
        <hr className="flex-1 border-gray-200" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="flex flex-col h-full animate-pulse">
            <div className="relative aspect-[3/4] bg-gray-200 rounded-2xl overflow-hidden shrink-0" />
            <div className="mt-2 px-0.5 flex flex-col flex-grow gap-2">
              <div className="h-4 bg-gray-200 rounded w-4/5" />
              <div className="h-4 bg-gray-200 rounded w-3/5" />
              <div className="mt-auto flex flex-col items-start gap-2 pt-1">
                <div className="h-4 bg-gray-200 rounded w-1/3" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="text-gray-500 text-center pt-6 text-sm">
        Loading matching products...
      </p>
    </div>
  );

  if (!isOpen) return null;

  const showingQuery = query.length >= 1;
  const productTitle = showingQuery
    ? `Trending Products for "${query}":`
    : "Trending Products:";

  return (
    <>
      <div
        className="fixed inset-0 z-[9998]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* ── Outer wrapper: anchored directly under the navbar ── */}
      <div
        className="fixed left-0 right-0 bottom-0 z-[9999] font-[family-name:var(--font-montserrat)] px-0 md:px-[5%] transition-all duration-300 flex justify-center"
        style={{ top: isMobile ? 0 : `${navbarBottom}px` }}
      >
        {/* ── Inner modal: fills the viewport space below the navbar ── */}
        <div
          className="relative flex w-full max-w-[1130px] md:px-7 min-h-0 flex-col shadow-2xl md:rounded-b-2xl overflow-hidden"
          style={{
            height: isMobile
              ? "100dvh"
              : `calc(100dvh - ${navbarBottom}px)`,
            background: `${isMobile ? "#fff7f4" : "radial-gradient(circle at 98% 2%, #edf4bc 0%, rgba(237,244,188,0.5) 20%, transparent 35%),#d1ffd9"}`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute top-3 right-3 md:right-4 text-gray-500 hover:text-gray-900 text-xl leading-none transition-colors z-10 cursor-pointer"
            aria-label="Close search"
          >
            ✕
          </button>

          <div className="md:px-6 md:my-5 md:pt-5 md:pb-3 max-w-[1000px] h-18 md:h-auto mx-auto w-full backdrop-blur-md rounded-xl">
            <div className="relative">
              <div className="absolute left-3 md:top-5 top-9 -translate-y-1/2 text-gray-400 pointer-events-none">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
              <input
                ref={inputRef}
                type="text"
                className="w-full py-2.5 pl-10 md:pl-11 mb-0 pr-10 text-sm md:rounded-xl h-18 md:h-auto border border-gray-400 bg-white md:bg-white/75 text-gray-800 focus:outline-none focus:border-[#b3a660] shadow-sm placeholder-gray-400 transition-all"
                placeholder="I'm Looking for..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSearchSubmit();
                  }
                }}
              />
              {isLoading && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-[#b3a660] border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
          </div>

          <div className="mx-2 md:mx-4 mb-3 md:mb-4 p-4 gb-[#fff7f4] md:bg-white/75 rounded-xl shadow-sm overflow-hidden flex flex-col flex-1 min-h-0">
            <div className="px-3 md:px-5 py-4 md:py-5 flex-1 min-h-0 overflow-y-auto custom-scrollbar">
              {renderMobilePanel()}
              <div className="flex flex-col md:flex-row gap-6 min-h-0">
                {renderLeftPanel()}
                <div className="flex-1 min-w-0 min-h-0 overflow-y-auto custom-scrollbar">
                  {showingQuery ? (
                    <div className="flex flex-col gap-6">
                      {isLoading ? (
                        renderProductsLoader(productTitle)
                      ) : matchedProducts.length > 0 ? (
                        renderProductGrid(matchedProducts, false, productTitle)
                      ) : !isLoading && matchedCategories.length === 0 ? (
                        <p className="text-gray-400 text-center py-8 text-sm italic">
                          No results found for &ldquo;{query}&rdquo;.
                        </p>
                      ) : null}

                      {matchedCategories.length > 0 && (
                        <div>
                          <div className="flex items-center gap-3 mb-4">
                            <h4 className="text-[16px] font-normal text-black tracking-wide whitespace-nowrap">
                              Categories:
                            </h4>
                            <hr className="flex-1 border-gray-200" />
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                            {matchedCategories.map((cat) => (
                              <Link
                                key={cat.data._id}
                                href={`/${cat.data.slug}`}
                                className="group flex flex-col h-full cursor-pointer"
                                onClick={() => {
                                  addClickedItem({
                                    type: "category",
                                    name: cat.data.name,
                                    categoryName: cat.data.name,
                                  });
                                  onClose();
                                }}
                              >
                                <div className="relative aspect-[3/4] bg-gray-50 rounded-lg overflow-hidden shrink-0">
                                  <Image
                                    src={getCategoryImageUrl(
                                      cat.data,
                                      "/assets/default-image.png",
                                    )}
                                    alt={cat.data.name}
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                                <div className="mt-2 px-0.5 flex flex-col flex-grow">
                                  <h5 className="text-[12px] text-gray-800 font-medium line-clamp-2 leading-snug min-h-[36px]">
                                    {cat.data.name}
                                  </h5>
                                  <span className="inline-block mt-1.5 border-b border-black text-[11px] text-black uppercase tracking-wide transition-all duration-300 group-hover:tracking-widest group-hover:text-[#b3a660]">
                                    View Collection
                                  </span>
                                </div>
                              </Link>
                            ))}
                          </div>
                          <div className="mt-8 flex justify-center">
                            <Link
                              href={getSearchResultsHref(query)}
                              onClick={() => {
                                addSearchQuery(query);
                                onClose();
                              }}
                              className="inline-block border border-black text-black px-6 py-2.5 text-[12px] uppercase tracking-[0.15em] font-medium transition-colors duration-300 rounded-[2px] hover:bg-black hover:text-white"
                            >
                              View all collections for &ldquo;{query}&rdquo;
                            </Link>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    trendingProducts.length > 0 && (
                      <div className="flex flex-col gap-6">
                        {renderProductGrid(
                          trendingProducts,
                          true,
                          productTitle,
                        )}
                        {trendingCategories.length > 0 &&
                          renderCategoryGrid(trendingCategories)}
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SearchModal;
