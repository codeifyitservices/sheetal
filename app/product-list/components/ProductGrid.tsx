"use client";
import React from "react";
import Image from "next/image";
import Link from "next/link";
import { buildProductHref } from "../../utils/productRoutes";

interface Product {
  _id: string;
  slug: string;
  name: string;
  image: string;
  hoverImage: string;
  categorySlug?: string;
  price: number;
  mrp: number;
  discount: string;
  size: string;
  rating: number;
  soldOut: boolean;
  isWishlisted: boolean;
  isStarred: boolean;
}

interface ProductGridProps {
  products: Product[];
  viewMode: "grid" | "list";
  onToggleWishlist: (productId: string) => void;
  onQuickView: (productSlug: string) => void;
}

const ProductCard: React.FC<{
  product: Product;
  viewMode: "grid" | "list";
  onToggleWishlist: (productId: string) => void;
  onQuickView: (productSlug: string) => void;
}> = ({ product, viewMode, onToggleWishlist, onQuickView }) => {
  const productHref = buildProductHref(product);
  
  return (
    <div
      className={`group flex transition-all rounded-xl p-1 md:p-2 h-full
        ${viewMode === "grid" ? "flex-col w-full max-w-[90%] mx-auto" : "flex-row items-center gap-3 md:gap-4 lg:gap-6"}`}
    >
      <div
        className={`relative overflow-hidden bg-[#f7f7f7] rounded-lg shadow-sm shrink-0
          ${
            viewMode === "grid"
              ? "mb-3 md:mb-5 aspect-[3/4] w-full"
              : "w-[42%] sm:w-[34%] md:w-[42%] lg:w-[38%] aspect-[3/4]"
          }`}
      >
        {product.soldOut && (
          <div className="absolute top-0 left-0 z-10 bg-red-600 text-white text-[8px] md:text-[9px] px-2 md:px-4 py-1 md:py-1.5 tracking-[0.2em] font-bold uppercase rounded-r-sm">
            Sold Out
          </div>
        )}

        <Link
          href={productHref}
          className="block w-full h-full relative overflow-hidden rounded-lg"
        >
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 overflow-hidden rounded-lg">
            <Image
              src={product.hoverImage}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover"
            />
          </div>
        </Link>

        <div className="absolute top-2 right-2 flex flex-col gap-3">
          <button
            className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center group/icon cursor-pointer"
            onClick={() => onToggleWishlist(product._id)}
          >
            <Image
              src={
                product.isWishlisted
                  ? "/assets/icons/heart-solid.svg"
                  : "/assets/icons/heart.svg"
              }
              alt="Wishlist"
              width={16}
              height={16}
              className={
                product.isWishlisted
                  ? ""
                  : "group-hover/icon:brightness-0 group-hover/icon:invert"
              }
            />
          </button>
        </div>

        <button
          onClick={() => onQuickView(product.slug)}
          className="hidden md:block absolute bottom-0 left-0 right-0 bg-white/15 backdrop-blur-xs border-t border-white/20 py-3 md:py-4 text-[10px] md:text-[11px] font-bold uppercase tracking-[0.2em] text-white stroke-3 shadow-[0_-8px_24px_rgba(0,0,0,0.12)] transform translate-y-full transition-transform duration-500 group-hover:translate-y-0 group-focus-within:translate-y-0 focus:translate-y-0 focus-visible:translate-y-0 hover:bg-white/25 hover:text-white cursor-pointer"
        >
          Quick View
        </button>
      </div>

      <div
        className={` h-full px-0.5 md:px-1 font-[family-name:var(--font-montserrat)] ${
          viewMode === "list" ? "pl-1.5 md:pl-3 lg:pl-4" : "flex flex-col flex-grow"
        }`}
      >
        <h3
          className={`text-[13px] md:text-[15px] lg:text-[17px] leading-snug line-clamp-2 pb-1 mb-2 ${
            viewMode === "list"
              ? "min-h-[2.9rem] md:min-h-[3.4rem] lg:min-h-[3.8rem]"
              : ""
          }`}
        >
          <Link
            href={productHref}
            className="hover:text-[#bd9951] transition-colors tracking-tight"
          >
            {product.name}
          </Link>
        </h3>

        <div className="mt-auto">
          <div className="flex items-center gap-0.5 my-2">
            {[...Array(5)].map((_, i) => (
              <Image
                key={i}
                src={
                  i < product.rating
                    ? "/assets/y-star.png"
                    : "/assets/gray-star.png"
                }
                alt="star"
                width={12}
                height={12}
                className="w-3 h-3 md:w-4 md:h-4"
              />
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-1 md:gap-2 mb-2 md:mb-3">
            {product.mrp !== undefined && product.price !== undefined && Number(product.mrp) !== Number(product.price) ? (
              <>
                <span className="text-xs sm:text-sm md:text-base font-medium text-gray-900 whitespace-nowrap">
                  ₹{product.price.toLocaleString("en-IN")}
                </span>
                <span className="text-[10px] sm:text-xs md:text-sm text-gray-400 line-through whitespace-nowrap">
                  ₹{product.mrp.toLocaleString("en-IN")}
                </span>
                {product.discount && (
                  <span className="text-[10px] sm:text-xs md:text-sm text-[#B78D65] font-semibold whitespace-nowrap uppercase">
                    {product.discount}
                  </span>
                )}
              </>
            ) : (
              <span className="text-xs sm:text-sm md:text-base font-medium text-gray-900 whitespace-nowrap">
                ₹{(product.mrp || product.price).toLocaleString("en-IN")}
              </span>
            )}
          </div>

          <Link
            href={productHref}
            className="inline-block border-b border-black text-black py-1.5 md:py-2 hover:tracking-[2px] hover:text-red-500 uppercase text-[11px] md:text-[13px] transition-all duration-500"
          >
            View Detail
          </Link>
        </div>
      </div>
    </div>
  );
};

const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  viewMode,
  onToggleWishlist,
  onQuickView,
}) => {
  return (
    <div
      className={`grid gap-1 md:gap-3 xl:gap-5
        ${
          viewMode === "grid"
            ? "grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            : "grid-cols-1 lg:grid-cols-2"
        }`}
    >
      {products.map((product) => (
        <ProductCard
          key={product._id}
          product={product}
          viewMode={viewMode}
          onToggleWishlist={onToggleWishlist}
          onQuickView={onQuickView}
        />
      ))}
    </div>
  );
};

export default ProductGrid;
