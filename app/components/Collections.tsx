"use client";

import React, { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Image from "next/image";
import Link from "next/link";
import {
  getProductHoverImageUrl,
  getProductImageUrl,
  Product,
} from "../services/productService";
import { useWishlist } from "../hooks/useWishlist";
import WishlistLoginModal from "./WishlistLoginModal";
import { buildProductHref } from "../utils/productRoutes";
import StarRating from "../product/components/StarRating";
import { CollectionsContent } from "../services/homepageService";

const MIN_FOR_CAROUSEL_DESKTOP = 5;
const MIN_FOR_CAROUSEL_MOBILE = 2;

interface CollectionProduct {
  id: string;
  productId: string;
  categorySlug?: string;
  name: string;
  image: string;
  hoverImage: string;
  price: string;
  mrp: string;
  discount: string;
  soldOut: boolean;
  rating: number;
}

function ProductCard({
  product,
  isWishlisted,
  onToggleWishlist,
}: {
  product: CollectionProduct;
  isWishlisted: boolean;
  onToggleWishlist: (productId: string) => void;
}) {
  const href = buildProductHref({
    slug: product.id,
    categorySlug: product.categorySlug,
  });

  return (
    <div className="rounded-xl overflow-hidden group h-full flex flex-col">
      <div className="relative aspect-[3/4] overflow-hidden">
        {product.soldOut && (
          <div className="absolute -top-1 left-0 z-20">
            <span className="bg-red-600 text-white text-[10px] px-2 py-1 uppercase font-bold tracking-wider rounded-br-lg">
              SOLD OUT
            </span>
          </div>
        )}

        <div className="absolute top-2 right-2 flex flex-col gap-3 z-20">
          <button
            className="w-10 h-10 rounded-full flex items-center justify-center group/icon cursor-pointer"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleWishlist(product.productId);
            }}
          >
            <Image
              src={
                isWishlisted
                  ? "/assets/icons/heart-solid.svg"
                  : "/assets/icons/heart.svg"
              }
              alt="Wishlist"
              width={18}
              height={18}
              className={
                isWishlisted
                  ? ""
                  : "group-hover/icon:brightness-0 group-hover/icon:invert"
              }
            />
          </button>
        </div>

        <Link href={href} className="block h-full w-full relative">
          <Image
            src={product.image}
            alt={product.name}
            width={400}
            height={533}
            className="w-full h-full object-cover rounded-xl transition-opacity duration-700 group-hover:opacity-0"
          />
          <Image
            src={product.hoverImage}
            alt={product.name}
            width={400}
            height={533}
            className="absolute inset-0 w-full h-full rounded-xl object-cover opacity-0 transition-opacity duration-700 group-hover:opacity-100"
          />
        </Link>
      </div>

      <div className="p-4 text-center flex flex-col flex-1">
        <h6 className="mb-2 h-[40px] overflow-hidden flex items-center justify-center">
          <Link
            href={href}
            className="text-[15px] md:text-[17px] text-black hover:text-[#B78D65] font-normal line-clamp-2 leading-tight"
          >
            {product.name}
          </Link>
        </h6>

        <div className="mt-auto">
          <div className="mb-3 flex justify-center">
            <StarRating rating={product.rating} />
          </div>

          <div
            className="w-full flex flex-nowrap items-center justify-center gap-1 mb-4 px-1"
            style={{ containerType: "inline-size" } as React.CSSProperties}
          >
            {product.discount ? (
              <>
                <span className="text-[16px] text-[#281b00] font-medium whitespace-nowrap">
                  {product.price}
                </span>
                <span className="text-[13px] text-gray-400 line-through whitespace-nowrap">
                  {product.mrp}
                </span>
                <span className="text-[16px] text-[#6a3f0e] font-normal whitespace-nowrap">
                  {product.discount}
                </span>
              </>
            ) : (
              <span className="text-[16px] text-[#281b00] font-medium whitespace-nowrap">
                {product.mrp}
              </span>
            )}
          </div>

          <Link
            href={href}
            className="inline-block rounded border-y border-black text-black py-3 px-6 md:px-8 text-[10px] md:text-[16px] uppercase transition-all duration-500 hover:border-[#a2690f]"
          >
            View Product
          </Link>
        </div>
      </div>
    </div>
  );
}

const Collections = ({ content }: { content?: CollectionsContent }) => {
  const [products, setProducts] = useState<CollectionProduct[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isCarousel, setIsCarousel] = useState(false);

  const {
    heading = "Collections",
    subheading = "Best-Selling Gems: Signature sarees, ensembles, and Indo-Western pieces that define Studio By Sheetal.",
    products: propProducts = [],
  } = content || {};

  const {
    wishlist,
    toggleProductInWishlist,
    isLoginModalOpen,
    closeLoginModal,
    handleLoginRedirect,
  } = useWishlist();

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "start",
    skipSnaps: false,
  });

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  const formatProduct = (p: Product): CollectionProduct => {
    let minPrice = Infinity;
    let relatedMrp = 0;

    p.variants?.forEach((v: any) => {
      v.sizes?.forEach((s: any) => {
        const effective =
          s.discountPrice && s.discountPrice > 0 ? s.discountPrice : s.price;
        if (effective < minPrice) {
          minPrice = effective;
          relatedMrp = s.price;
        }
      });
    });

    if (minPrice === Infinity) {
      minPrice = 0;
      relatedMrp = 0;
    }

    const discountStr =
      minPrice > 0 && relatedMrp > minPrice
        ? `${Math.round(((relatedMrp - minPrice) / relatedMrp) * 100)}% OFF`
        : "";

    const validVariants = p.variants?.filter((v: any) =>
      v.sizes?.some((s: any) => s.stock > 0),
    );
    const isSoldOut =
      !validVariants || validVariants.length === 0 || p.stock <= 0;

    return {
      id: p.slug,
      productId: p._id,
      categorySlug: p.category?.slug,
      name: p.name,
      image: getProductImageUrl(p),
      hoverImage: getProductHoverImageUrl(p, getProductImageUrl(p)),
      price: `₹ ${minPrice.toFixed(2)}`,
      mrp: `₹ ${relatedMrp.toFixed(2)}`,
      discount: discountStr,
      soldOut: isSoldOut,
      rating: p.averageRating || 0,
    };
  };

  useEffect(() => {
    const update = () => {
      const isMobile = window.innerWidth < 768;
      const min = isMobile ? MIN_FOR_CAROUSEL_MOBILE : MIN_FOR_CAROUSEL_DESKTOP;
      setIsCarousel(products.length >= min);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [products]);

  useEffect(() => {
    if (propProducts && propProducts.length > 0) {
      setProducts(propProducts.map(formatProduct));
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [propProducts]);

  useEffect(() => {
    if (emblaApi) emblaApi.reInit();
  }, [emblaApi, products]);

  if (loading) return null;
  if (products.length === 0) return null;

  return (
    <div className="container-fluid px-4 pb-10 sm:px-6 md:pb-12 lg:px-20 home-page-product font-[family-name:var(--font-montserrat)]">
      <div className="container mx-auto px-0 md:px-4">
        {/* HEADING */}
        <div className="flex flex-col items-center mb-10">
          <div className="flex items-center justify-center gap-6 w-full">
            <div className="h-[2px] bg-[#68400f] w-15 hidden md:flex" />
            <h2 className="font-[family-name:var(--font-optima)] text-[#6a3f0e] whitespace-nowrap">
              {heading}
            </h2>
            <div className="h-[2px] bg-[#68400f] w-15 hidden md:flex" />
          </div>
          <p className="text-center mb-6 text-[15px] mt-2">{subheading}</p>
        </div>

        {/* CAROUSEL */}
        {isCarousel ? (
          <div className="relative group/slider">
            <div ref={emblaRef} className="overflow-hidden">
              <div className="flex gap-3 px-2 sm:px-3 md:gap-4 md:px-4">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="flex-shrink-0 w-[75%] sm:w-[45%] lg:w-[25%]"
                  >
                    <ProductCard
                      product={product}
                      isWishlisted={wishlist.some(
                        (p) => p._id === product.productId,
                      )}
                      onToggleWishlist={toggleProductInWishlist}
                    />
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={scrollPrev}
              aria-label="Previous product"
              className="absolute left-[-50px] cursor-pointer bottom-[40%] -translate-y-1/2 w-12 h-12 flex items-center justify-center opacity-0 group-hover/slider:opacity-100 transition-opacity duration-300 z-10"
            >
              <Image
                src="/assets/left-image.png"
                alt="Previous"
                width={48}
                height={48}
                className="w-full h-auto"
              />
            </button>
            <button
              onClick={scrollNext}
              aria-label="Next product"
              className="absolute right-[-50px] cursor-pointer bottom-[40%] -translate-y-1/2 w-12 h-12 flex items-center justify-center opacity-0 group-hover/slider:opacity-100 transition-opacity duration-300 z-10"
            >
              <Image
                src="/assets/right-image.png"
                alt="Next"
                width={48}
                height={48}
                className="w-full h-auto"
              />
            </button>
          </div>
        ) : (
          /* STATIC GRID */
          <div className="flex flex-wrap gap-4 justify-center">
            {products.map((product) => (
              <div
                key={product.id}
                className="w-[85%] sm:w-[48%] md:w-[32%] lg:w-[23%]"
              >
                <ProductCard
                  product={product}
                  isWishlisted={wishlist.some(
                    (p) => p._id === product.productId,
                  )}
                  onToggleWishlist={toggleProductInWishlist}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <WishlistLoginModal
        isOpen={isLoginModalOpen}
        onClose={closeLoginModal}
        onLogin={handleLoginRedirect}
      />
    </div>
  );
};

export default Collections;
