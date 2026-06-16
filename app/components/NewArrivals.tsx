"use client";

import React, { useCallback, useState, useEffect } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Image from "next/image";
import Link from "next/link";
import { getNewArrivals, Product } from "@/app/services/productService";
import { useWishlist } from "../hooks/useWishlist";
import WishlistLoginModal from "./WishlistLoginModal";
import { buildProductHref } from "@/app/utils/productRoutes";
import StarRating from "../product/components/StarRating";

const MIN_FOR_CAROUSEL = 5;

const NewArrivals = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading]   = useState(true);

  const {
    wishlist,
    toggleProductInWishlist,
    isLoginModalOpen,
    closeLoginModal,
    handleLoginRedirect,
  } = useWishlist();

  const isCarousel = products.length >= MIN_FOR_CAROUSEL;

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "start",
    skipSnaps: false,
  });

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  useEffect(() => {
    if (emblaApi) emblaApi.reInit();
  }, [emblaApi, products]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await getNewArrivals();
        if (res.success) setProducts(res.products);
      } catch (err) {
        console.error("Failed to fetch new arrivals:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getDisplayPrice = (product: Product) => {
    let minPrice = Infinity;
    let relatedMrp = 0;

    product.variants?.forEach((v: any) => {
      v.sizes?.forEach((s: any) => {
        const effective = s.discountPrice > 0 ? s.discountPrice : s.price;
        if (effective < minPrice) { minPrice = effective; relatedMrp = s.price; }
      });
    });

    if (minPrice === Infinity) { minPrice = 0; relatedMrp = 0; }

    const discount =
      minPrice > 0 && relatedMrp > minPrice
        ? `${Math.round(((relatedMrp - minPrice) / relatedMrp) * 100)}% OFF`
        : "";

    return {
      price:    `₹ ${minPrice.toFixed(2)}`,
      mrp:      `₹ ${relatedMrp.toFixed(2)}`,
      discount,
    };
  };

  const ProductCard = ({ product }: { product: Product }) => {
    const displayPrice = getDisplayPrice(product);
    const isWishlisted = wishlist.some((p) => p._id === product._id);
    const productHref = buildProductHref(product);

    return (
      <div className="rounded-xl overflow-hidden group h-full flex flex-col">
        <div className="relative aspect-[3/4] overflow-hidden">
          {product.stock === 0 && (
            <div className="absolute top-0 left-0 z-20">
              <span className="bg-red-600 text-white text-[10px] px-2 py-1 uppercase font-bold rounded-br-lg">
                SOLD OUT
              </span>
            </div>
          )}

          {/* Wishlist */}
          <div className="absolute top-2 right-2 flex flex-col gap-3 transform translate-x-12 opacity-0 transition-all duration-500 group-hover:translate-x-0 group-hover:opacity-100 z-20">
            <button
              className="w-10 h-10 rounded-full flex items-center justify-center group/icon"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleProductInWishlist(product._id);
              }}
            >
              <Image
                src={isWishlisted ? "/assets/icons/heart-solid.svg" : "/assets/icons/heart.svg"}
                alt="Wishlist"
                width={18}
                height={18}
                className={isWishlisted ? "" : "group-hover/icon:brightness-0 group-hover/icon:invert"}
              />
            </button>
          </div>

          <Link href={productHref} className="block h-full w-full relative">
            <Image
              src={product.mainImage?.url || "/assets/placeholder-product.jpg"}
              alt={product.name}
              width={400}
              height={533}
              className="w-full h-full object-cover rounded-xl transition-opacity duration-700 group-hover:opacity-0"
            />
            <Image
              src={product.hoverImage?.url || product.mainImage?.url || "/assets/placeholder-product.jpg"}
              alt={product.name}
              width={400}
              height={533}
              className="absolute inset-0 w-full h-full object-cover rounded-xl opacity-0 transition-opacity duration-700 group-hover:opacity-100"
            />
          </Link>
        </div>

        <div className="p-3 md:p-4 text-center flex flex-col flex-1">
          <h6 className="mb-2 h-[40px] overflow-hidden flex items-center justify-center">
            <Link
              href={productHref}
              className="text-[16px] md:text-[14px] text-black hover:text-[#B78D65] font-medium line-clamp-2"
            >
              {product.name}
            </Link>
          </h6>

          <div className="mt-auto">
            <div className="flex justify-center mb-3">
              <StarRating rating={product.averageRating || 0} />
            </div>

            <div
              className="w-full flex flex-wrap items-center justify-center gap-1 mb-3 px-1"
              style={{ containerType: "inline-size" } as React.CSSProperties}
            >
              {displayPrice.discount ? (
                <>
                  <span className="text-[16px] text-[#000000] font-medium whitespace-nowrap">
                    {displayPrice.price}
                  </span>
                  <span className="text-[14px] text-gray-400 line-through whitespace-nowrap">
                    {displayPrice.mrp}
                  </span>
                  <span className="text-[16px] text-[#6a3f0e] font-bold whitespace-nowrap">
                    {displayPrice.discount}
                  </span>
                </>
              ) : (
                <span className="text-[clamp(11px,5cqw,18px)] text-[#281b00] font-bold whitespace-nowrap">
                  {displayPrice.mrp}
                </span>
              )}
            </div>

            <Link
              href={productHref}
              className="inline-block rounded border-y border-black text-black py-1.5 md:py-3 px-6 md:px-8 text-[10px] md:text-[16px] uppercase transition-all duration-500 hover:border-[#a2690f]"
            >
              View Product
            </Link>
          </div>
        </div>
      </div>
    );
  };

  const SkeletonCard = () => (
    <div className="rounded-xl overflow-hidden animate-pulse">
      <div className="aspect-[3/4] bg-gray-200 rounded-xl" />
      <div className="p-4 text-center space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto" />
        <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto" />
      </div>
    </div>
  );

  return (
    <div className="container-fluid px-4 py-10 sm:px-6 md:py-16 lg:px-20 font-[family-name:var(--font-montserrat)]">
      <div className="container mx-auto px-0 md:px-4">

        {/* On mobile: heading + text stacked above carousel.
            On lg+: side-by-side grid. */}
        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6 lg:gap-8 items-start lg:items-center">

          {/* LEFT CONTENT */}
          <div className="lg:col-span-3 xl:col-span-4 text-center md:text-left">
            <h2 className="text-[#6a3f07] mb-3 font-[family-name:var(--font-optima)] leading-tight">
              New Arrivals
            </h2>
            <p className="mb-5 px-2 text-[15px] text-black font-[family-name:var(--font-montserrat)] md:mb-8 md:p-0 md:text-[18px]">
              Pick your beauty products today. 50% OFF on the new brands. Order
              all classy products today!
            </p>
            <Link
              href="/product-list?sort=newest"
              className="inline-block rounded border-y border-black text-black py-2.5 md:py-3 px-8 md:px-10 text-[16px] uppercase transition-all duration-500 hover:border-[#a2690f]"
            >
              Explore More
            </Link>
          </div>

          {/* RIGHT – CAROUSEL or GRID */}
          <div className="lg:col-span-9 xl:col-span-8 w-full">
            {loading ? (
              <div className="grid grid-cols-2 gap-3 px-0 sm:px-2 md:grid-cols-3 md:gap-4 md:px-4">
                {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : isCarousel ? (
              <div className="relative group/slider">
                <div ref={emblaRef} className="overflow-hidden">
                  <div className="flex gap-3 px-1 sm:px-2 md:gap-4 md:px-4">
                    {products.map((product) => (
                      <div
                        key={product._id}
                        className="flex-shrink-0 w-[80%] sm:w-[48%] md:w-[40%] lg:w-[33.333%]"
                      >
                        <ProductCard product={product} />
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={scrollPrev}
                  aria-label="Previous product"
                  className="absolute left-[-50px] cursor-pointer bottom-[40%] -translate-y-1/2 w-12 h-12 flex items-center justify-center opacity-0 group-hover/slider:opacity-100 transition-opacity duration-300 z-10"
                >
                  <Image src="/assets/left-image.png" alt="Previous" width={48} height={48} className="w-full h-auto" />
                </button>
                <button
                  onClick={scrollNext}
                  aria-label="Next product"
                  className="absolute right-[-50px] cursor-pointer bottom-[40%] -translate-y-1/2 w-12 h-12 flex items-center justify-center opacity-0 group-hover/slider:opacity-100 transition-opacity duration-300 z-10"
                >
                  <Image src="/assets/right-image.png" alt="Next" width={48} height={48} className="w-full h-auto" />
                </button>
              </div>
            ) : (
              /* Static grid when fewer than 5 products */
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                {products.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <WishlistLoginModal
        isOpen={isLoginModalOpen}
        onClose={closeLoginModal}
        onLogin={handleLoginRedirect}
      />
    </div>
  );
};

export default NewArrivals;
