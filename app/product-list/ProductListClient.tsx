"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

import FilterSortMobile from "./components/FilterSortMobile";
import MobileSortSheet from "./components/MobileSortSheet";
import WishlistLoginModal from "../components/WishlistLoginModal";
import ProductListBanner from "./components/ProductListBanner";
import ProductFilterBar from "./components/ProductFilterBar";
import ProductGrid from "./components/ProductGrid";
import QuickView from "./components/QuickView";
import StorefrontLoadingShell from "../components/StorefrontLoadingShell";

import { getProductImageUrl } from "../services/productService";
import { fetchCategoryBySlug } from "../services/categoryService";
import { getApiImageUrl } from "../services/api";

import { useProducts } from "../hooks/useProducts";
import { useWishlist } from "../hooks/useWishlist";
import { useProductFilters } from "../hooks/useProductFilters";
import {
  consumeRedirectField,
  consumeRedirectModalState,
} from "../utils/authRedirect";
import { ORDER_CONFIRMED_EVENT } from "../hooks/shopEvents";

interface ProductListProps {
  categorySlug?: string;
}

const ProductListContent = ({
  categorySlug: propCategorySlug,
}: ProductListProps) => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const categorySlug = propCategorySlug || searchParams.get("category");
  const subCategory = searchParams.get("subCategory");
  const searchQuery = searchParams.get("search");

  // Redirect /product-list?category=xyz to /xyz
  useEffect(() => {
    if (pathname === "/product-list" && categorySlug) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("category");
      const queryString = params.toString();
      const newPath = `/${categorySlug}${queryString ? `?${queryString}` : ""}`;
      router.replace(newPath);
    }
  }, [pathname, categorySlug, router, searchParams]);

  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);
  const [isResolvingCategory, setIsResolvingCategory] =
    useState(!!categorySlug);
  const [selectedProductSlug, setSelectedProductSlug] = useState<string | null>(
    null,
  );

  /* =======================
     UI State
  ======================= */
  const [mobileSortOpen, setMobileSortOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortByOpen, setSortByOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const activeType = searchParams.get("type");
  const activeValue = searchParams.get("value");

  const [activeFilters, setActiveFilters] = useState<
    { label: string; type: string; value: string }[]
  >([]);

  useEffect(() => {
    if (activeType && activeValue) {
      setActiveFilters([
        {
          label: `${activeType}: ${activeValue}`,
          type: activeType,
          value: activeValue,
        },
      ]);
    } else {
      if (!activeType && !activeValue) {
        setActiveFilters([]);
      }
    }
  }, [activeType, activeValue]);

  useEffect(() => {
    const shouldRestoreQuickView = consumeRedirectModalState("quickViewOpen");
    const restoredSlug = consumeRedirectField<string>("selectedProductSlug");

    if (shouldRestoreQuickView && restoredSlug) {
      setSelectedProductSlug(restoredSlug);
    }
  }, []);

  const [sortOption, setSortOption] = useState<string>("newest");

  /* =======================
     Wishlist
  ======================= */
  const {
    isProductInWishlist,
    toggleProductInWishlist,
    isLoginModalOpen,
    closeLoginModal,
    handleLoginRedirect,
  } = useWishlist();

  /* =======================
     Resolve Category Slug → ID
  ======================= */
  useEffect(() => {
    const resolveCategory = async () => {
      if (!categorySlug) {
        setCategoryId(undefined);
        setIsResolvingCategory(false);
        return;
      }

      setIsResolvingCategory(true);
      try {
        const category = await fetchCategoryBySlug(categorySlug);
        if (category?._id) {
          setCategoryId(category._id);
        } else {
          console.warn("Category not found:", categorySlug);
          setCategoryId(undefined);
          router.replace("/");
        }
      } catch (error) {
        console.error("Error resolving category:", error);
        setCategoryId(undefined);
        router.replace("/");
      } finally {
        setIsResolvingCategory(false);
      }
    };

    resolveCategory();
  }, [categorySlug]);

  /* =======================
     Fetch Products
  ======================= */
  const {
    products,
    loading: productsLoading,
    error,
    refetch,
  } = useProducts(
    {
      category: categoryId,
      subCategory: subCategory || undefined,
      search: searchQuery || undefined,
      sort: sortOption,
      limit: 50,
    },
    !categorySlug || !!categoryId,
  );

  /* =======================
     Extract Filter Options
  ======================= */
  const filterOptions = useProductFilters(products);

  const loading = isResolvingCategory || (productsLoading && products.length === 0);
  const queryString = searchParams.toString();

  useEffect(() => {
    if (!queryString) return;
    const target = document.getElementById("product-grid-section");
    if (target) {
      target.scrollIntoView({ behavior: "smooth" });
    }
  }, [queryString]);

  useEffect(() => {
    const handleOrderConfirmed = () => {
      void refetch({
        category: categoryId,
        subCategory: subCategory || undefined,
        search: searchQuery || undefined,
        sort: sortOption,
        limit: 50,
      });
    };

    window.addEventListener(ORDER_CONFIRMED_EVENT, handleOrderConfirmed);
    return () => {
      window.removeEventListener(ORDER_CONFIRMED_EVENT, handleOrderConfirmed);
    };
  }, [categoryId, categorySlug, refetch, searchQuery, sortOption, subCategory]);

  /* =======================
     Handlers
  ======================= */
  const handleMobileSort = (option: string) => {
    setSortOption(option);
    setMobileSortOpen(false);
  };

  const handleSortChange = (option: string) => {
    setSortOption(option);
  };

  const handleFilterChange = (type: string, value: string) => {
    const filterLabel = `${type}: ${value}`;
    const existing = activeFilters.find((f) => f.label === filterLabel);

    // Price is the only single-select filter (one range at a time)
    // All other types including category support multiple selections
    if (type === "price") {
      if (existing) {
        setActiveFilters(activeFilters.filter((f) => f.type !== "price"));
      } else {
        setActiveFilters([
          ...activeFilters.filter((f) => f.type !== "price"),
          { label: filterLabel, type, value },
        ]);
      }
    } else {
      if (existing) {
        setActiveFilters(activeFilters.filter((f) => f.label !== filterLabel));
      } else {
        setActiveFilters([
          ...activeFilters,
          { label: filterLabel, type, value },
        ]);
      }
    }
  };

  const removeFilter = (label: string) => {
    setActiveFilters(activeFilters.filter((f) => f.label !== label));
  };

  const clearFilters = () => {
    setActiveFilters([]);
  };

  const handleQuickView = (slug: string) => {
    setSelectedProductSlug(slug);
  };

  /* =======================
     Transform Products for Grid
  ======================= */
  const gridProducts = products.map((p) => {
    let lowestPrice = Infinity;
    let lowestMrp = Infinity;

    p.variants?.forEach((variant) => {
      variant.sizes?.forEach((size) => {
        const currentPrice =
          size.discountPrice && size.discountPrice > 0
            ? size.discountPrice
            : size.price;
        if (currentPrice < lowestPrice) {
          lowestPrice = currentPrice;
          lowestMrp = size.price;
        }
      });
    });

    const discountPercent =
      lowestMrp > 0 && lowestPrice < lowestMrp
        ? Math.round(((lowestMrp - lowestPrice) / lowestMrp) * 100)
        : 0;

    const allSizes = Array.from(
      new Set(p.variants?.flatMap((v) => v.sizes?.map((s) => s.name)) || []),
    );

    const sizeLabel =
      allSizes.length === 0
        ? "One Size"
        : allSizes.length === 1
          ? allSizes[0]
          : `${allSizes[0]}–${allSizes[allSizes.length - 1]}`;

    const resolvedCategorySlug =
      p.categorySlug || p.category?.slug || categorySlug || undefined;

    return {
      _id: p._id,
      slug: p.slug,
      name: p.name,
      categorySlug: resolvedCategorySlug,
      image: getProductImageUrl(p),
      hoverImage: p.hoverImage?.url
        ? getApiImageUrl(p.hoverImage.url)
        : getProductImageUrl(p),
      price: lowestPrice,
      mrp: lowestMrp,
      discount: discountPercent > 0 ? `${discountPercent}% OFF` : "",
      size: sizeLabel,
      rating: p.averageRating || 0,
      soldOut: p.stock <= 0,
      isWishlisted: isProductInWishlist(p._id),
      isStarred: p.isStarred || false,
    };
  });

  /* =======================
     Apply Filters and Sorting
  ======================= */
  let filteredProducts = [...gridProducts];

  const filtersByType = activeFilters.reduce(
    (acc, filter) => {
      if (!acc[filter.type]) acc[filter.type] = [];
      acc[filter.type].push(filter.value);
      return acc;
    },
    {} as Record<string, string[]>,
  );

  (Object.entries(filtersByType) as [string, string[]][]).forEach(
    ([type, values]) => {
      if (type === "size") {
        filteredProducts = filteredProducts.filter((p) =>
          products
            .find((prod) => prod._id === p._id)
            ?.variants?.some((v) =>
              v.sizes?.some((s) => values.includes(s.name)),
            ),
        );
      } else if (type === "color") {
        filteredProducts = filteredProducts.filter((p) =>
          products
            .find((prod) => prod._id === p._id)
            ?.variants?.some((v) => values.includes(v.color?.name ?? "")),
        );
      } else if (type === "price") {
        filteredProducts = filteredProducts.filter((p) =>
          values.some((val) => {
            const [min, max] = val.split("-").map(Number);
            return p.price >= min && (isNaN(max) || p.price <= max);
          }),
        );
      } else if (type === "availability") {
        filteredProducts = filteredProducts.filter((p) => {
          const product = products.find((prod) => prod._id === p._id);
          return values.some((val) => {
            if (val === "In Stock") return product && product.stock > 10;
            if (val === "Low Stock (≤10)")
              return product && product.stock > 0 && product.stock <= 10;
            return false;
          });
        });
      } else if (type === "category") {
        // Multi-select: keep products matching ANY of the selected categories
        filteredProducts = filteredProducts.filter((p) => {
          const product = products.find((prod) => prod._id === p._id);
          return values.includes(product?.category?.name ?? "");
        });
      } else {
        filteredProducts = filteredProducts.filter((p) => {
          const product = products.find((prod) => prod._id === p._id);
          const productFields = product as Record<string, unknown> | undefined;
          const fieldValue = productFields?.[type];
          if (typeof fieldValue === "string") {
            return values.includes(fieldValue);
          }
          return (
            Array.isArray(fieldValue) &&
            values.some((val) => fieldValue.includes(val))
          );
        });
      }
    },
  );

  if (sortOption === "price_asc") {
    filteredProducts.sort((a, b) => a.price - b.price);
  } else if (sortOption === "price_desc") {
    filteredProducts.sort((a, b) => b.price - a.price);
  } else if (sortOption === "popularity") {
    filteredProducts.sort((a, b) => {
      if (a.isStarred && !b.isStarred) return -1;
      if (!a.isStarred && b.isStarred) return 1;
      return b.rating - a.rating;
    });
  } else {
    // Default sorting (e.g., "newest"): Star priority first
    filteredProducts.sort((a, b) => {
      if (a.isStarred && !b.isStarred) return -1;
      if (!a.isStarred && b.isStarred) return 1;
      return 0;
    });
  }

  /* =======================
     Render
  ======================= */
  return (
    <>
      <ProductListBanner
        categorySlug={categorySlug || undefined}
        searchQuery={searchQuery}
      />

      <div className="container mx-auto px-4 sm:px-6 lg:px-20">
        <ProductFilterBar
          filtersOpen={filtersOpen}
          toggleFilters={() => setFiltersOpen(!filtersOpen)}
          sortByOpen={sortByOpen}
          toggleSortBy={() => setSortByOpen(!sortByOpen)}
          activeFilters={activeFilters}
          removeFilter={removeFilter}
          clearFilters={clearFilters}
          viewMode={viewMode}
          setViewMode={(mode) => setViewMode(mode)}
          filterOptions={filterOptions}
          totalProducts={filteredProducts.length}
          onFilterChange={handleFilterChange}
          onSortChange={handleSortChange}
          currentSort={sortOption}
        />

        <div id="product-grid-section">
          {loading ? (
            <div className="flex min-h-[40vh] items-center justify-center py-16">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 rounded-full border-4 border-gray-200 border-t-[#bd9951] animate-spin" />
                <p className="text-sm md:text-base text-gray-500 tracking-wide">
                  Loading products...
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="flex justify-center py-20">
              <p className="text-red-500">{error}</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex justify-center py-12 md:py-20 px-4 text-center">
              <p className="text-gray-500">
                {activeFilters.length > 0
                  ? "No products match your filters. Try adjusting your selection."
                  : "No products found."}
              </p>
            </div>
          ) : (
            <ProductGrid
              products={filteredProducts}
              viewMode={viewMode}
              onToggleWishlist={toggleProductInWishlist}
              onQuickView={handleQuickView}
            />
          )}
        </div>
      </div>

      <div className="md:hidden">
        <FilterSortMobile
          onFilterClick={() => setFiltersOpen(true)}
          onSortClick={() => setMobileSortOpen(true)}
          activeFilterCount={activeFilters.length}
        />
      </div>

      <MobileSortSheet
        isOpen={mobileSortOpen}
        onClose={() => setMobileSortOpen(false)}
        onSelect={handleMobileSort}
        currentSort={sortOption}
      />

      {selectedProductSlug && (
        <QuickView
          productSlug={selectedProductSlug}
          onClose={() => setSelectedProductSlug(null)}
        />
      )}

      <WishlistLoginModal
        isOpen={isLoginModalOpen}
        onClose={closeLoginModal}
        onLogin={handleLoginRedirect}
      />
    </>
  );
};

/* =======================
   Suspense Wrapper
======================= */
const ProductList = (props: ProductListProps) => {
  return (
    <Suspense
      fallback={<StorefrontLoadingShell message="Loading products..." />}
    >
      <ProductListContent {...props} />
    </Suspense>
  );
};

export default ProductList;
