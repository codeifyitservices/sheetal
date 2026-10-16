import React from "react";
import Image from "next/image";
import Link from "next/link";
import { CartItem } from "../../hooks/useCart";
import { getApiImageUrl } from "../../services/api";
import { buildProductHref } from "../../utils/productRoutes";

// Looser type to support both cart items and buy-now items
type DisplayItem = CartItem | {
  product: {
    _id: string;
    name: string;
    mainImage?: { url: string };
    slug?: string;
    sku?: string;
    category?: { _id?: string; name?: string; slug?: string } | string | null;
    categorySlug?: string | null;
  };
  size: string;
  color: string;
  quantity: number;
  price: number;
  discountPrice?: number;
  variantImage?: string;
  _id?: string;
};

interface MiniCartSummaryProps {
  cartItems: DisplayItem[];
  loading?: boolean;
}

const MiniCartSummary: React.FC<MiniCartSummaryProps> = ({
  cartItems,
  loading = false,
}) => {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const showSkeleton = loading || !mounted;

  return (
    <div className="p-4 mb-4">
      <h3 className="text-md font-semibold mb-3 border-b border-gray-200 pb-2">
        Order Summary
      </h3>
      <div className="space-y-4" suppressHydrationWarning>
        {showSkeleton ? (
          <div className="flex gap-3 items-center animate-pulse">
            <div className="w-16 h-20 shrink-0 bg-gray-200 rounded" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
              <div className="h-4 bg-gray-200 rounded w-1/4" />
            </div>
          </div>
        ) : (
          <>
            {cartItems.map((item, idx) => {
              const imageUrl = getApiImageUrl(
                item.variantImage || item.product?.mainImage?.url,
              );
              const price = (item.discountPrice || item.price || 0).toFixed(2);
              const productHref = buildProductHref(item.product);

              return (
                <div key={item._id ?? idx} className="flex gap-3 items-center">
                  <Link
                    href={productHref}
                    className="w-16 h-20 shrink-0 relative block overflow-hidden rounded group bg-gray-100 hover:opacity-95 transition-opacity cursor-pointer"
                    title={`View ${item.product?.name || "product"}`}
                  >
                    <Image
                      src={imageUrl}
                      alt={item.product?.name || "Product"}
                      fill
                      className="object-cover rounded group-hover:scale-105 transition-transform duration-200"
                    />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={productHref}
                      className="text-sm font-medium text-gray-800 hover:text-[#bd9951] hover:underline line-clamp-2 transition-colors block cursor-pointer"
                      title={item.product?.name}
                    >
                      {item.product?.name}
                    </Link>
                    <p className="text-xs text-gray-500 mt-1">
                      Qty: {item.quantity} | {item.size} | {item.color}
                    </p>
                    <p className="text-sm font-semibold mt-1">₹{price}</p>
                  </div>
                </div>
              );
            })}
            {cartItems.length === 0 && (
              <p className="text-sm text-gray-500">No items in cart.</p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MiniCartSummary;
