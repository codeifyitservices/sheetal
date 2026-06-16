"use client";
import React from "react";
import Image from "next/image";
import Link from "next/link";
import toast from "react-hot-toast";
import { CartItem } from "../../hooks/useCart";
import { getApiImageUrl } from "../../services/api";
import DeleteConfirmationModal from "./DeleteConfirmationModal";
import ShareMenu from "../../components/ShareMenu";
import { buildProductHref } from "../../utils/productRoutes";

interface CartItemsListProps {
  cartItems: CartItem[];
  applicableCategories: string[];
  itemWiseDiscount: { [cartItemId: string]: number } | null;
  moveFromCartToWishlist: (itemId: string, productId: string) => Promise<void>;
  updateCartItemQuantity: (itemId: string, quantity: number) => Promise<void>;
  onShareCart: () => Promise<string | null>;
  handleRemoveItem: (item: CartItem) => void;
  handleMoveToWishlistAction: (item: CartItem) => void;
  isModalOpen: boolean;
  confirmRemoveItem: () => Promise<void>;
  cancelRemoveItem: () => void;
  handleMoveToWishlist: () => Promise<void>;
  cartLength: number;
  selectedItemIds: string[];
  onSelectionChange: (itemId: string) => void;
  onBulkRemove: () => void;
  onBulkHeart: () => void;
  isBulkAction: boolean;
  modalAction: "remove" | "wishlist";
}

const CartItemsList: React.FC<CartItemsListProps> = ({
  cartItems,
  applicableCategories,
  itemWiseDiscount,
  moveFromCartToWishlist,
  updateCartItemQuantity,
  onShareCart,
  handleRemoveItem,
  handleMoveToWishlistAction,
  isModalOpen,
  confirmRemoveItem,
  cancelRemoveItem,
  handleMoveToWishlist,
  cartLength,
  selectedItemIds,
  onSelectionChange,
  onBulkRemove,
  onBulkHeart,
  isBulkAction,
  modalAction,
}) => {
  const getStockLimitMessage = (count: number) =>
    `This item only has ${count} left.`;

  const getItemAvailableStock = (item: CartItem) => {
    if (typeof item.availableStock === "number" && item.availableStock >= 0) {
      return item.availableStock;
    }

    const variants = item.product?.variants;
    if (Array.isArray(variants) && variants.length > 0) {
      const selectedVariant =
        variants.find(
          (variant) =>
            String(variant?.color?.name || "").trim().toLowerCase() ===
            String(item.color || "").trim().toLowerCase(),
        ) ||
        variants.find((variant) =>
          Array.isArray(variant?.sizes) &&
          variant.sizes.some(
            (size) =>
              String(size?.name || "").trim().toLowerCase() ===
              String(item.size || "").trim().toLowerCase(),
          ),
        );

      const selectedSize = selectedVariant?.sizes?.find(
        (size) =>
          String(size?.name || "").trim().toLowerCase() ===
          String(item.size || "").trim().toLowerCase(),
      );

      if (selectedSize) {
        return Number(selectedSize.stock) || 0;
      }
    }

    return Number(item.product?.stock) || 0;
  };

  return (
    <>
      {isModalOpen && (
        <DeleteConfirmationModal
          onConfirm={confirmRemoveItem}
          onCancel={cancelRemoveItem}
          onMoveToWishlist={handleMoveToWishlist}
          isBulkAction={isBulkAction}
          itemCount={isBulkAction ? selectedItemIds.length : 1}
          mode={modalAction}
        />
      )}

      <div className="w-full lg:w-8/12">
        {/* Header */}
        <div className="flex flex-wrap justify-start items-center gap-3 mb-4">
          <div className="flex items-end gap-2 mr-4">
            <h2 className="text-[#6a3f07] font-optima">
              My Cart
            </h2>
            <span className="text-[16px] font-normal mb-1 font-[family-name:var(--font-montserrat)]">
              ({cartLength} items)
            </span>
          </div>
          <div className="flex gap-7 items-center">
            <ShareMenu
              getUrl={onShareCart}
              title="My Studio By Sheetal Cart"
              text="I found some amazing outfits at Studio By Sheetal! Check them out."
            >
              <button
                type="button"
                className="cursor-pointer hover:opacity-80 flex items-center justify-center"
                aria-label="Share cart"
              >
                <Image
                  src="/assets/icons/share.svg"
                  alt="Share"
                  width={20}
                  height={20}
                />
              </button>
            </ShareMenu>
            <button
              className="cursor-pointer hover:opacity-80"
              onClick={onBulkRemove}
            >
              <Image
                src="/assets/icons/delete.svg"
                alt="Delete Selected"
                width={22}
                height={22}
              />
            </button>
            <button
              className="cursor-pointer hover:opacity-80"
              onClick={onBulkHeart}
            >
              <Image
                src="/assets/icons/heart-b.svg"
                alt="Wishlist Selected"
                width={22}
                height={22}
              />
            </button>
          </div>
        </div>

        {/* Cart List */}
        <div className="divide-y divide-gray-100">
          {cartItems.map((item) => {
            const availableStock = getItemAvailableStock(item);
            const displayOriginalPrice = item.price ?? 0;
            const displayDiscountPrice =
              item.discountPrice ?? displayOriginalPrice;
            const discountPercentage =
              displayOriginalPrice > 0
                ? Math.round(
                    ((displayOriginalPrice - displayDiscountPrice) /
                      displayOriginalPrice) *
                      100,
                  )
                : 0;
            const productHref = buildProductHref(item.product);
            const showCouponBadge =
              applicableCategories.length > 0 &&
              itemWiseDiscount &&
              itemWiseDiscount[item._id] > 0;

            return (
              <div key={item._id} className="flex items-start py-3 gap-3">
                {/* Image */}
                <div className="w-[70px] md:w-[100px] shrink-0">
                  {/* Checkbox */}
                  <div className="pt-1 shrink-0 relative">
                    <input
                      type="checkbox"
                      className="peer w-4 h-4 absolute top-2 left-1 appearance-none rounded-full border border-[#bd9951] bg-gray-100 hover:bg-gray-300 checked:hover:bg-[#aee470] checked:bg-[#8bc34a] cursor-pointer"
                      checked={selectedItemIds.includes(item._id)}
                      onChange={() => onSelectionChange(item._id)}
                    />

                    {/* Tick */}
                    <svg
                      className="absolute top-[7px] left-[4px] w-4 h-4 text-white opacity-0 peer-checked:opacity-100 pointer-events-none"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="5"
                    >
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  </div>

                  <button
                    type="button"
                    className="block w-full cursor-pointer text-left"
                    onClick={() => onSelectionChange(item._id)}
                    aria-pressed={selectedItemIds.includes(item._id)}
                    aria-label={`Select ${item.product.name}`}
                  >
                    <Image
                      src={getApiImageUrl(
                        item.variantImage || item.product.mainImage?.url,
                      )}
                      alt={item.product.name}
                      width={120}
                      height={160}
                      className="w-full h-auto"
                    />
                  </button>
                </div>

                {/* Product Info + Price (stacked on mobile, side-by-side on md+) */}
                <div className="flex flex-1 flex-col md:flex-row md:items-start md:justify-between gap-2 min-w-0 md:pr-20">
                  {/* Left: name, color/size, coupon, wishlist */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[13px] md:text-[15px] tracking-[1px] leading-snug line-clamp-2 font-[family-name:var(--font-montserrat)]">
                      <Link
                        href={productHref}
                        className="hover:text-[#bd9951] transition-colors"
                      >
                        {item.product.name}
                      </Link>
                    </h3>
                    <p className="text-xs md:text-[12px] tracking-[1px] text-gray-600 mt-1 font-[family-name:var(--font-montserrat)]">
                      <strong>Color:</strong> {item.color} |{" "}
                      <strong>Size:</strong> {item.size}
                    </p>

                    {applicableCategories.length > 0 &&
                      ((item.product.category &&
                        applicableCategories.includes(
                          typeof item.product.category === "object"
                            ? item.product.category._id
                            : item.product.category,
                        )) ||
                        applicableCategories.includes(item.product._id)) && (
                        <span className="text-xs text-blue-600 font-medium">
                          {applicableCategories.includes(item.product._id)
                            ? "Product Coupon Applied"
                            : "Category Coupon Applied"}
                        </span>
                      )}

                    <button
                      className="text-xs cursor-pointer md:text-[12px] tracking-[1px] text-[#bd9951] font-[family-name:var(--font-montserrat)] underline underline-offset-2 mt-2 block"
                      onClick={() =>
                        handleMoveToWishlistAction(item)
                      }
                    >
                      Move to Wishlist
                    </button>
                  </div>

                  {/* Right: price + qty */}
                  <div className="flex flex-row md:flex-col items-center md:items-start justify-between md:justify-start gap-2 shrink-0">
                    {/* Price row */}
                    <div className="flex flex-wrap items-center gap-1 md:gap-2 md:justify-end font-bold font-[family-name:var(--font-montserrat)]">
                      <span className="text-[13px] md:text-[14px]">
                        ₹ {(displayDiscountPrice * item.quantity).toFixed(2)}
                      </span>
                      {displayOriginalPrice > displayDiscountPrice && (
                        <span className="text-[14px] text-gray-500 line-through">
                          ₹ {(displayOriginalPrice * item.quantity).toFixed(2)}
                        </span>
                      )}
                      {discountPercentage > 0 && (
                        <span className="text-[14px] text-[#6a3f0e]">
                          [ {discountPercentage}% OFF ]
                        </span>
                      )}
                      {showCouponBadge && (
                        <span className="text-xs text-green-600 px-2 py-0.5 rounded-full bg-green-50 border border-green-200">
                          -₹{itemWiseDiscount[item._id].toFixed(2)}
                        </span>
                      )}
                    </div>

                    {/* Quantity */}
                    <div className="flex items-center gap-2 text-sm">
                      <button
                        className="rounded-full cursor-pointer w-6 h-6 flex items-center justify-center"
                        onClick={() =>
                          updateCartItemQuantity(item._id, item.quantity - 1)
                        }
                        disabled={item.quantity <= 1}
                      >
                        −
                      </button>
                      <span className="w-4 text-center">{item.quantity}</span>
                      <button
                        className="rounded-full cursor-pointer w-6 h-6 flex items-center justify-center"
                        onClick={() => {
                          if (item.quantity >= availableStock) {
                            toast.error(getStockLimitMessage(availableStock));
                            return;
                          }

                          updateCartItemQuantity(item._id, item.quantity + 1);
                        }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div></div>
                </div>

                {/* Remove */}
                <div className="shrink-0">
                  <button
                    className="text-gray-500 hover:text-red-600 cursor-pointer"
                    onClick={() => handleRemoveItem(item)}
                  >
                    <Image
                      src="/assets/icons/delete.svg"
                      alt="Delete Selected"
                      width={20}
                      height={20}
                    />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default CartItemsList;
