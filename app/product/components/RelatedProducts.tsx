import React, { useMemo, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import ProductCard from "./ProductCard";
import Image from "next/image";

interface RelatedProductItem {
  id: string;
  productId?: string;
  name: string;
  image: string;
  hoverImage?: string;
  price?: number;
  mrp?: number;
  discount?: string;
  soldOut?: boolean;
  rating?: number;
}

interface RelatedProductsProps {
  similarProducts: RelatedProductItem[];
  isProductInWishlist: (id: string) => boolean;
  onToggleWishlist: (id: string) => void;
  currentSlug: string;
}

const EmblaSlider = ({
  products,
  isProductInWishlist,
  onToggleWishlist,
}: {
  products: RelatedProductItem[];
  isProductInWishlist: (id: string) => boolean;
  onToggleWishlist: (id: string) => void;
}) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
    dragFree: true,
  });

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  return (
    <div className="relative group/slider">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-4">
          {products.map((product) => (
            <div
              key={product.id}
              className="flex-[0_0_100%] min-w-0 sm:flex-[0_0_50%] md:flex-[0_0_33.33%] lg:flex-[0_0_25%]"
            >
              <ProductCard
                product={product}
                isWishlisted={isProductInWishlist(
                  product.productId || product.id, // productId now exists
                )}
                onToggleWishlist={onToggleWishlist}
              />
            </div>
          ))}
        </div>
      </div>

      {products.length > 4 && (
        <>
          <button
            onClick={scrollPrev}
            aria-label="Previous product"
            className="absolute left-[-20px] md:left-[-50px] cursor-pointer top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center opacity-0 group-hover/slider:opacity-100 transition-opacity duration-300 z-10"
          >
            <Image
              src="/assets/left-image.png"
              alt=""
              width={48}
              height={48}
              className="w-full h-auto"
            />
          </button>
          <button
            onClick={scrollNext}
            aria-label="Next product"
            className="absolute right-[-20px] md:right-[-50px] cursor-pointer top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center opacity-0 group-hover/slider:opacity-100 transition-opacity duration-300 z-10"
          >
            <Image
              src="/assets/right-image.png"
              alt=""
              width={48}
              height={48}
              className="w-full h-auto"
            />
          </button>
        </>
      )}
    </div>
  );
};

const RelatedProducts: React.FC<RelatedProductsProps> = ({
  similarProducts,
  isProductInWishlist,
  onToggleWishlist,
  currentSlug,
}) => {
  const recentlyViewedProducts = useMemo(() => {
    if (typeof window === "undefined") return [];

    try {
      const raw = localStorage.getItem("__rv__");
      const parsed = raw ? (JSON.parse(raw) as RelatedProductItem[]) : [];
      return parsed.filter((product) => product.id !== currentSlug);
    } catch {
      return [];
    }
  }, [currentSlug]);

  const hasSimilarProducts = similarProducts.length > 0;
  const hasRecentlyViewedProducts = recentlyViewedProducts.length > 0;

  if (!hasSimilarProducts && !hasRecentlyViewedProducts) {
    return null;
  }

  return (
    <>
      {hasSimilarProducts && (
        <div
          id="similar-products-section"
          className="container mx-auto px-4 py-12"
        >
          <h3 className="text-[26px] text-[#a2690f] w-full text-center border-y-[1px] py-4 border-gray-300 mb-8 font-[family-name:var(--font-optima)]">
            Similar Products
          </h3>
          <EmblaSlider
            products={similarProducts}
            isProductInWishlist={isProductInWishlist}
            onToggleWishlist={onToggleWishlist}
          />
        </div>
      )}

      {hasRecentlyViewedProducts && (
        <div
          id="recently-viewed-section"
          className="container mx-auto px-4 py-12 mb-12"
        >
          <h3 className="text-[26px] text-[#a2690f] w-full text-center border-y-[1px] py-4 border-gray-300 mb-8 font-[family-name:var(--font-optima)]">
            Recently Viewed
          </h3>
          <EmblaSlider
            products={recentlyViewedProducts}
            isProductInWishlist={isProductInWishlist}
            onToggleWishlist={onToggleWishlist}
          />
        </div>
      )}
    </>
  );
};

export default RelatedProducts;
