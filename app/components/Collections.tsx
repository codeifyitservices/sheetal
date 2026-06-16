"use client";

import React, { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Image from "next/image";
import Link from "next/link";
import {
  getCollectionProducts,
  CollectionProduct,
} from "../services/productService";
import { useWishlist } from "../hooks/useWishlist";
import WishlistLoginModal from "./WishlistLoginModal";
import { buildProductHref } from "../utils/productRoutes";
import StarRating from "../product/components/StarRating";

const MIN_FOR_CAROUSEL_DESKTOP = 5;
const MIN_FOR_CAROUSEL_MOBILE = 2;

const FALLBACK_PRODUCTS: CollectionProduct[] = [
  {
    _id: "fallback-1",
    name: "Rama Green Zariwork Soft Silk Saree",
    slug: "product-detail",
    image: "/assets/494291571.webp",
    imageAlt: "Rama Green Zariwork Soft Silk Saree",
    hoverImage: "/assets/487339289.webp",
    hoverImageAlt: "Rama Green Zariwork Soft Silk Saree",
    price: "₹ 790.50",
    mrp: "₹ 850.00",
    discount: "7% OFF",
    soldOut: true,
  },
  {
    _id: "fallback-2",
    name: "Mustard Zariwork Organza Fabric Readymade Salwar Suit",
    slug: "product-detail",
    image: "/assets/590900458.webp",
    imageAlt: "Mustard Zariwork Organza Fabric Readymade Salwar Suit",
    hoverImage: "/assets/789323917.webp",
    hoverImageAlt: "Mustard Zariwork Organza Fabric Readymade Salwar Suit",
    price: "₹ 790.50",
    mrp: "₹ 850.00",
    discount: "7% OFF",
    soldOut: false,
  },
  {
    _id: "fallback-3",
    name: "Onion Pink Zariwork Tissue Saree",
    slug: "product-detail",
    image: "/assets/670149944.webp",
    imageAlt: "Onion Pink Zariwork Tissue Saree",
    hoverImage: "/assets/882872675.webp",
    hoverImageAlt: "Onion Pink Zariwork Tissue Saree",
    price: "₹ 790.50",
    mrp: "₹ 850.00",
    discount: "7% OFF",
    soldOut: false,
  },
  {
    _id: "fallback-4",
    name: "Sky Blue Threadwork Semi Crepe Readymade Salwar Suit",
    slug: "product-detail",
    image: "/assets/229013918.webp",
    imageAlt: "Sky Blue Threadwork Semi Crepe Readymade Salwar Suit",
    hoverImage: "/assets/493323435.webp",
    hoverImageAlt: "Sky Blue Threadwork Semi Crepe Readymade Salwar Suit",
    price: "₹ 790.50",
    mrp: "₹ 850.00",
    discount: "7% OFF",
    soldOut: false,
  },
];

const Collections = () => {
  const [products, setProducts] = useState<CollectionProduct[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isCarousel, setIsCarousel] = useState(false);
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

  // Recompute isCarousel whenever products or viewport changes
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
    const load = async () => {
      try {
        const data = await getCollectionProducts();
        const visibleProducts = (data || []).filter((product) =>
          Boolean(
            product &&
            product._id &&
            product.slug &&
            product.name &&
            (product.status ? product.status === "Active" : true),
          ),
        );
        setProducts(visibleProducts);
      } catch (err) {
        console.error("Collections fetch error:", err);
        setProducts(FALLBACK_PRODUCTS);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (emblaApi) emblaApi.reInit();
  }, [emblaApi, products]);

  if (loading) return null;

  return (
    <div className="container-fluid px-4 pb-10 sm:px-6 md:pb-12 lg:px-20 home-page-product font-[family-name:var(--font-montserrat)]">
      <div className="container mx-auto px-0 md:px-4">
        {/* HEADING */}
        <div className="flex flex-col items-center mb-10">
          <div className="flex items-center justify-center gap-6 w-full">
            <div className="h-[2px] bg-[#68400f] w-15 hidden md:flex" />
            <h2 className="font-[family-name:var(--font-optima)] text-[#6a3f0e] whitespace-nowrap">
              Collections
            </h2>
            <div className="h-[2px] bg-[#68400f] w-15 hidden md:flex" />
          </div>
          <p className="text-center mb-6 text-[15px] mt-2">
            Best-Selling Gems: Signature sarees, ensembles, and Indo-Western
            pieces that define Studio By Sheetal.
          </p>
        </div>

        {/* CAROUSEL */}
        {isCarousel ? (
          <div className="relative group/slider">
            <div ref={emblaRef} className="overflow-hidden">
              <div className="flex gap-3 px-2 sm:px-3 md:gap-4 md:px-4">
                {products.map((product) => (
                  <div
                    key={product._id}
                    className="shrink-0 w-[75%] sm:w-[48%] md:w-[32%] lg:w-[25%]"
                  >
                    <ProductCard
                      product={product}
                      isWishlisted={wishlist.some((p) => p._id === product._id)}
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
          /* STATIC GRID */
          <div className="flex flex-wrap gap-4 justify-center">
            {products.map((product) => (
              <div
                key={product._id}
                className="w-[85%] sm:w-[48%] md:w-[32%] lg:w-[23%]"
              >
                <ProductCard
                  product={product}
                  isWishlisted={wishlist.some((p) => p._id === product._id)}
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

// ─── Individual card ───────────────────────────────────────────────────────────
function ProductCard({
  product,
  isWishlisted,
  onToggleWishlist,
}: {
  product: CollectionProduct;
  isWishlisted: boolean;
  onToggleWishlist: (productId: string) => void;
}) {
  const href = buildProductHref(product);

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

        <div className="absolute top-2 right-2 flex flex-col gap-3 transform translate-x-12 opacity-0 transition-all duration-500 group-hover:translate-x-0 group-hover:opacity-100 z-20">
          <button
            className="w-10 h-10 rounded-full flex items-center justify-center group/icon cursor-pointer"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleWishlist(product._id);
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
            alt={product.imageAlt}
            width={400}
            height={533}
            className="w-full h-full object-cover rounded-xl transition-opacity duration-700 group-hover:opacity-0"
          />
          <Image
            src={product.hoverImage || product.image}
            alt={product.hoverImageAlt}
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
            className="text-[17px] text-black hover:text-[#B78D65] line-clamp-2 leading-tight"
          >
            {product.name}
          </Link>
        </h6>

        <div className="mt-auto">
          <div className="mb-3 flex justify-center">
            <StarRating rating={product.averageRating || 0} />
          </div>

          <div className="mb-4 flex justify-center items-center gap-2 flex-wrap">
            {product.price && (
              <span className="text-[16px] text-[#281b00] font-medium">
                {product.price}
              </span>
            )}
            {product.mrp && (
              <span className="text-[14px] text-gray-400 line-through">
                {product.mrp}
              </span>
            )}
            {product.discount && (
              <span className="text-[16px] text-[#6a3f0e] font-normal">
                {product.discount}
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

export default Collections;
