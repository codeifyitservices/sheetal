"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import StarRating from "./StarRating";
import { buildProductHref } from "../../utils/productRoutes";

interface ProductCardProps {
  product: any;
  isWishlisted?: boolean;
  onToggleWishlist?: (productId: string) => void;
}

const ProductCard = ({
  product,
  isWishlisted = false,
  onToggleWishlist,
}: ProductCardProps) => {
  const wishlistProductId = product.productId || product._id;
  const productHref = buildProductHref(product);

  return (
    <div className="p-2 group h-full flex flex-col">
      {/* Image */}
      <div className="relative overflow-hidden mb-3">
        {product.soldOut && (
          <div className="absolute top-0 left-0 z-10 bg-red-600 px-2 py-1 rounded-lg">
            <span className="text-white text-xs font-semibold tracking-wider">
              SOLD OUT
            </span>
          </div>
        )}

        <div className="absolute top-2 right-2 z-10">
          <button
            type="button"
            className="p-2 rounded-full shadow-md cursor-pointer hover:text-white transition-colors"
            onClick={() => {
              if (wishlistProductId && onToggleWishlist) {
                onToggleWishlist(wishlistProductId);
              }
            }}
          >
            <Image
              src={
                isWishlisted
                  ? "/assets/icons/heart-solid.svg"
                  : "/assets/icons/heart.svg"
              }
              alt="wishlist"
              width={20}
              height={20}
              className="w-5 h-5"
            />
          </button>
        </div>

        <Link href={productHref}>
          <div className="relative aspect-[3/4]">
            <Image
              src={product.image || "/assets/placeholder-product.jpg"}
              alt={product.name}
              fill
              className="object-cover transition-opacity duration-500 group-hover:opacity-0 rounded-lg"
            />
            <Image
              src={product.hoverImage || "/assets/placeholder-product.jpg"}
              alt={product.name}
              fill
              className="object-cover absolute top-0 left-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 rounded-lg"
            />
          </div>
        </Link>
      </div>

      {/* Text content — grows to fill remaining space so bottom items always align */}
      <div className="flex flex-col flex-1 text-left">
        {/* Title — fixed 2-line height so all cards reserve the same space */}
        <h6
          className="text-[16px] font-medium line-clamp-2 leading-tight font-[family-name:var(--font-montserrat)]"
          style={{ minHeight: "2.5rem" }}
        >
          <Link
            href={productHref}
            className="hover:text-[#bd9951] transition-colors"
          >
            {product.name}
          </Link>
        </h6>

        {/* Bottom-pinned section */}
        <div className="mt-auto pt-2 space-y-3">
          <div className="flex justify-start items-center w-full text-left">
            <StarRating rating={product.rating || 0} />
          </div>

          <div className="flex items-center gap-2 text-sm">
            <span className="font-normal text-[16px] text-[#281b00]">
              ₹{" "}
              {typeof product.price === "number"
                ? product.price.toFixed(2)
                : product.price}
            </span>
            <span className="line-through text-gray-400 text-[14px]">
              ₹{" "}
              {typeof product.mrp === "number"
                ? product.mrp.toFixed(2)
                : product.mrp}
            </span>
            <span className="text-[#6a3f0b] text-[16px]">
              [{product.discount}]
            </span>
          </div>

          <div className="flex justify-start">
            <Link
              href={productHref}
              className="inline-block border-b border-black text-black py-1.5 md:py-2 hover:tracking-[2px] hover:text-red-500 uppercase text-[11px] md:text-[13px] transition-all duration-500"
            >
              View Detail
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
