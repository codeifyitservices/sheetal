"use client";
import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Product } from "../../services/productService";
import { buildProductHref } from "../../utils/productRoutes";

interface WishlistItemCardProps {
  product: Product & {
    lowestPrice: number;
    lowestMrp: number;
    discountPercent: number;
  };
  onRemove: (productId: string) => void;
  onMoveToCart: (product: Product) => void;
  isMovingToCart?: boolean;
}

const WishlistItemCard: React.FC<WishlistItemCardProps> = ({
  product,
  onRemove,
  onMoveToCart,
  isMovingToCart = false,
}) => {
  const productHref = buildProductHref(product);
  const similarHref = buildProductHref(product, { scroll: "similar" });

  return (
    <div className="group p-2 flex flex-col">
      <div className="relative overflow-hidden bg-[#f7f7f7] rounded-lg">
        {product.stock < 1 && (
          <div className="absolute -top-1 left-0 z-20">
            <span className="bg-red-600 text-white text-[10px] px-2 py-1 uppercase font-bold tracking-wider rounded-br-lg">
              SOLD OUT
            </span>
          </div>
        )}
        <button
          onClick={() => onRemove(product._id)}
          className="absolute cursor-pointer top-2 right-2 z-20 w-8 h-8 border border-[#f5eaac] rounded-full flex items-center justify-center text-[#f5eaac] hover:bg-gray-100 hover:text-[#bd9951] transition-all"
          aria-label="Remove from wishlist"
        >
          <span className="mb-0.5">&times;</span>
        </button>

        <Link
          href={productHref}
          className="block aspect-[3/4] relative"
        >
          <Image
            src={product.mainImage?.url || "/assets/placeholder-product.jpg"}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 overflow-hidden rounded-lg">
            {product.hoverImage?.url && (
              <Image
                src={
                  product.hoverImage.url || "/assets/placeholder-product.jpg"
                }
                alt={product.name}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                className="object-cover"
              />
            )}
          </div>
        </Link>
      </div>
      <div className="flex flex-col flex-grow pt-4 text-left font-[family-name:var(--font-montserrat)]">
        <h6 className="text-[17px] line-clamp-2 pb-1">
          <Link
            href={productHref}
            className="hover:text-[#bd9951] transition-colors"
          >
            {product.name}
          </Link>
        </h6>
        <div className="flex items-baseline gap-2 mb-4 font-medium">
          {product.lowestPrice > 0 ? (
            <>
              <span className="text-[16px] text-[#281b00]">
                &#8377; {product.lowestPrice.toLocaleString()}
              </span>
              {product.discountPercent > 0 && (
                <>
                  <span className="text-[14px] text-gray-500 line-through">
                    &#8377; {product.lowestMrp.toLocaleString()}
                  </span>
                  <span className="text-[16px] text-[#70480c]">
                    {product.discountPercent}% OFF
                  </span>
                </>
              )}
            </>
          ) : (
            <span className="text-[15px] font-medium text-[#70480c]">
              Price on Request
            </span>
          )}
        </div>
        <div className="mt-auto">
          {product.stock > 0 && product.lowestPrice > 0 ? (
            <button
              disabled={isMovingToCart}
              onClick={() => onMoveToCart(product)}
              className="cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 text-left text-[12px] border-b border-black text-black font-normal py-2 pr-6 uppercase transition-all duration-500 hover:text-red-600 hover:tracking-[1px]"
            >
              {isMovingToCart ? "Adding..." : "Add to Cart"}
            </button>
          ) : (
            <Link
              href={similarHref}
              className="cursor-pointer inline-block text-left text-[12px] border-b border-black text-black font-normal py-2 pr-6 uppercase transition-all duration-500 hover:text-red-600 hover:tracking-[1px]"
            >
              Show Similar
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default WishlistItemCard;
