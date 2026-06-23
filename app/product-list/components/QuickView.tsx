"use client";
import React, { useEffect, useRef, useState } from "react";
import {
  Product,
  ProductVariant,
  fetchProductBySlug,
  incrementProductView,
  getProductImageUrl,
  getVariantGalleryUrls,
} from "../../services/productService";
import { isAuthenticated } from "../../services/authService";
import ProductImageGallery from "../../product/components/ProductImageGallery";
import StarRating from "../../product/components/StarRating";
import { useRouter } from "next/navigation";
import { getApiImageUrl } from "../../services/api";
import Image from "next/image";
import { useWishlist } from "../../hooks/useWishlist";
import toast from "react-hot-toast";
import WishlistLoginModal from "../../components/WishlistLoginModal";

import { useCart } from "../../hooks/useCart";
import { redirectToLogin } from "../../utils/authRedirect";
import { ORDER_CONFIRMED_EVENT } from "../../hooks/shopEvents";
import { buildProductHref } from "../../utils/productRoutes";

const getStockLimitMessage = (count: number) =>
  `This item only has ${count} left.`;

const MemoizedProductImageGallery = React.memo(ProductImageGallery);

const QuickViewMedia = React.memo(function QuickViewMedia({
  images,
  selectedImage,
  onImageChange,
  title,
  isWishlisted,
  onToggleWishlist,
  onScrollToSimilar,
}: {
  images: string[];
  selectedImage: string;
  onImageChange: (value: string) => void;
  title: string;
  isWishlisted: boolean;
  onToggleWishlist: () => void;
  onScrollToSimilar: () => void;
}) {
  return (
    <div className="w-full sm:w-[52%] shrink-0 p-10">
      <MemoizedProductImageGallery
        images={images}
        selectedImage={selectedImage}
        onImageChange={onImageChange}
        title={title}
        isWishlisted={isWishlisted}
        onToggleWishlist={onToggleWishlist}
        onScrollToSimilar={onScrollToSimilar}
      />
    </div>
  );
});

interface QuickViewProps {
  productSlug: string | null;
  onClose: () => void;
}

const QuickView: React.FC<QuickViewProps> = ({ productSlug, onClose }) => {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [selectedVariantId, setSelectedVariantId] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const hasIncrementedViewRef = useRef(false);
  const selectedSizeRef = useRef("");
  const selectedColorRef = useRef("");
  // Removed lowestPrice and lowestMrp states
  const {
    isProductInWishlist,
    toggleProductInWishlist,
    isLoginModalOpen,
    closeLoginModal,
    handleLoginRedirect,
  } = useWishlist();
  const { addToCart } = useCart();
  const router = useRouter();

  useEffect(() => {
    selectedSizeRef.current = selectedSize;
  }, [selectedSize]);

  useEffect(() => {
    selectedColorRef.current = selectedColor;
  }, [selectedColor]);

  const getProduct = React.useCallback(async () => {
    if (!productSlug) return;

    setLoading(true);
    try {
      const response = await fetchProductBySlug(productSlug);
      if (response.success && response.data) {
        setProduct(response.data);
        if (!hasIncrementedViewRef.current) {
          hasIncrementedViewRef.current = true;
          incrementProductView(productSlug).catch(console.error);
        }
        const mainImg = getProductImageUrl(response.data);
        setSelectedImage(mainImg);

        const currentSelectedColor = selectedColorRef.current;
        const currentSelectedSize = selectedSizeRef.current;

        const matchedVariant =
          currentSelectedColor
            ? response.data.variants?.find(
                (v: ProductVariant) => v.color?.name === currentSelectedColor,
              )
            : null;
        const matchedSize = currentSelectedSize
          ? matchedVariant?.sizes.find(
              (s: ProductVariant["sizes"][number]) =>
                s.name === currentSelectedSize,
            ) || null
          : null;

        if (matchedVariant) {
          setSelectedVariantId(matchedVariant._id);
          if (matchedVariant.color?.name) {
            setSelectedColor(matchedVariant.color.name);
          }
          const refreshedGallery = getVariantGalleryUrls(
            response.data,
            matchedVariant,
          );
          setSelectedImage(
            refreshedGallery[0] || getProductImageUrl(response.data),
          );
          setSelectedSize(
            matchedSize?.name ||
              matchedVariant.sizes.find(
                (s: ProductVariant["sizes"][number]) => s.stock > 0,
              )?.name ||
              "",
          );
        } else {
          // Default size and color logic: find first available variant, its color, and its size
          const firstAvailableVariant = response.data.variants?.find(
            (v: ProductVariant) =>
              Array.isArray(v.sizes) &&
              v.sizes.length > 0 &&
              v.sizes.some((s) => s.stock > 0),
          );
          if (firstAvailableVariant) {
            setSelectedVariantId(firstAvailableVariant._id);
            if (firstAvailableVariant.color?.name) {
              setSelectedColor(firstAvailableVariant.color.name);
            }
            const initialGallery = getVariantGalleryUrls(
              response.data,
              firstAvailableVariant,
            );
            setSelectedImage(
              initialGallery[0] || getProductImageUrl(response.data),
            );
            const firstAvailableSize = firstAvailableVariant.sizes.find(
              (s: ProductVariant["sizes"][number]) => s.stock > 0,
            );
            setSelectedSize(firstAvailableSize?.name || "");
          } else {
            setSelectedVariantId("");
            setSelectedColor("");
            setSelectedSize("");
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch product", error);
    } finally {
      setLoading(false);
    }
    }, [productSlug]);

  useEffect(() => {
    if (productSlug) {
      void getProduct();

      const handleOrderConfirmed = () => {
        void getProduct();
      };

      const handleVisibilityChange = () => {
        if (document.visibilityState === "visible") {
          void getProduct();
        }
      };

      const handlePageFocus = () => {
        void getProduct();
      };

      const handlePageShow = () => {
        void getProduct();
      };

      window.addEventListener(ORDER_CONFIRMED_EVENT, handleOrderConfirmed);
      window.addEventListener("focus", handlePageFocus);
      window.addEventListener("pageshow", handlePageShow);
      document.addEventListener("visibilitychange", handleVisibilityChange);

      return () => {
        window.removeEventListener(ORDER_CONFIRMED_EVENT, handleOrderConfirmed);
        window.removeEventListener("focus", handlePageFocus);
        window.removeEventListener("pageshow", handlePageShow);
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      };
    }
  }, [getProduct, productSlug]);

  const { currentPrice, currentOriginalPrice, currentDiscount } =
    React.useMemo(() => {
      let price = 0;
      let originalPrice = 0;
      let discount = 0;

      if (product && selectedColor && selectedSize) {
        const selectedVariant = product.variants.find(
          (v) => v.color?.name === selectedColor,
        );

        if (selectedVariant) {
          const selectedSizeInfo = selectedVariant.sizes.find(
            (s) => s.name === selectedSize,
          );

          if (selectedSizeInfo) {
            price =
              selectedSizeInfo.discountPrice &&
              selectedSizeInfo.discountPrice > 0
                ? selectedSizeInfo.discountPrice
                : selectedSizeInfo.price;
            originalPrice = selectedSizeInfo.price;

            if (originalPrice > 0 && price < originalPrice) {
              discount = Math.round(
                ((originalPrice - price) / originalPrice) * 100,
              );
            }
          }
        }
      } else if (product) {
        // Fallback to lowest overall price if no selection yet, similar to initial rendering
        let minPrice = Infinity;
        let minMrp = Infinity;

        product.variants.forEach((variant) => {
          variant.sizes.forEach((size) => {
            const variantPrice =
              size.discountPrice && size.discountPrice > 0
                ? size.discountPrice
                : size.price;
            if (variantPrice < minPrice) {
              minPrice = variantPrice;
              minMrp = size.price;
            }
          });
        });
        price = minPrice === Infinity ? 0 : minPrice;
        originalPrice = minMrp === Infinity ? 0 : minMrp;
        if (originalPrice > 0 && price < originalPrice) {
          discount = Math.round(
            ((originalPrice - price) / originalPrice) * 100,
          );
        }
      }

      return {
        currentPrice: price,
        currentOriginalPrice: originalPrice,
        currentDiscount: discount,
      };
    }, [product, selectedColor, selectedSize]);

  const handleBuyNow = () => {
    if (!product) return;
    if (!selectedSize) {
      toast.error("Please select a size");
      return;
    }
    if (!selectedColor) {
      toast.error("Please select a color");
      return;
    }

    const selectedVariant = product.variants.find(
      (v) => v.color?.name === selectedColor,
    );
    const selectedSizeObject = selectedVariant?.sizes.find(
      (s) => s.name === selectedSize,
    );

    if (!selectedVariant || !selectedSizeObject) {
      toast.error("Selected variant not available");
      return;
    }

    const resolvedQuantity = Math.max(1, Number(quantity) || 1);
    if (resolvedQuantity > selectedSizeObject.stock) {
      toast.error(getStockLimitMessage(selectedSizeObject.stock));
      return;
    }
    const variantImageUrl = getApiImageUrl(
      selectedVariant.v_image,
      product.mainImage?.url || "/assets/placeholder-product.jpg",
    );

    const buyNowItem = {
      product: {
        _id: product._id,
        name: product.name,
        mainImage: product.mainImage,
        sku: product.sku,
        category: product.category,
      },
      variantId: selectedVariant._id,
      variantSku: selectedVariant.v_sku || product.sku,
      size: selectedSize,
      color: selectedColor,
      quantity: resolvedQuantity,
      price: selectedSizeObject.price || 0,
      discountPrice:
        selectedSizeObject.discountPrice || selectedSizeObject.price || 0,
      variantImage: variantImageUrl,
    };

    const encoded = encodeURIComponent(JSON.stringify(buyNowItem));
    const checkoutUrl = `/checkout/address?buynow=${encoded}`;

    if (!isAuthenticated()) {
      redirectToLogin(router, checkoutUrl, {
        modals: {
          quickViewOpen: true,
        },
        selectedProductSlug: productSlug,
      });
      onClose(); // close the modal before navigating
      return;
    }

    onClose();
    router.push(checkoutUrl);
  };

  const handleAddToCart = async () => {
    if (product) {
      const selectedVariant = product.variants.find(
        (variant) => variant.color?.name === selectedColor,
      );
      if (selectedVariant) {
        // Ensure a size is selected for addToCart
        if (!selectedSize) {
          console.error("Please select a size."); // Or show a toast message
          return;
        }
        const selectedSizeInfo = selectedVariant.sizes.find(
          (s) => s.name === selectedSize,
        );
        if (selectedSizeInfo) {
          if (quantity > selectedSizeInfo.stock) {
            toast.error(getStockLimitMessage(selectedSizeInfo.stock));
            return;
          }
          const variantImageUrl = getApiImageUrl(
            selectedVariant.v_image,
            product.mainImage?.url || "/assets/default-image.png",
          );
          await addToCart(
            product._id,
            selectedVariant._id,
            quantity,
            selectedSize,
            selectedSizeInfo.price,
            selectedSizeInfo.discountPrice,
            variantImageUrl, // 7th: variantImage
            selectedColor, // 8th: color
            {
              _id: product._id,
              name: product.name,
              slug: product.slug,
              mainImage: product.mainImage,
            },
            selectedSizeInfo.stock,
          );
          onClose();
        } else {
          console.error("Selected size info not found");
        }
      } else {
        console.error("Selected variant not found");
      }
    }
  };

  const displayPrice = currentPrice;
  const displayOriginalPrice = currentOriginalPrice;
  const discount = currentDiscount;
  const selectedVariant =
    product?.variants.find((variant) => variant._id === selectedVariantId) ||
    product?.variants.find((variant) => variant.color?.name === selectedColor) ||
    null;
  const selectedSizeInfo =
    selectedVariant?.sizes.find((size) => size.name === selectedSize) || null;
  const selectedAvailableStock = selectedSizeInfo?.stock ?? 0;
  const galleryImages = React.useMemo(
    () => getVariantGalleryUrls(product, selectedVariant),
    [product, selectedVariant],
  );
  const handleQuantityChange = React.useCallback((rawValue: string) => {
    const parsedQuantity = Math.max(1, parseInt(rawValue, 10) || 1);
    const normalizedMaxQuantity = Math.max(1, selectedAvailableStock);

    if (parsedQuantity > normalizedMaxQuantity) {
      toast.error(getStockLimitMessage(normalizedMaxQuantity));
    }

    setQuantity(Math.min(parsedQuantity, normalizedMaxQuantity));
  }, [selectedAvailableStock]);

  useEffect(() => {
    if (selectedAvailableStock <= 0) {
      setQuantity(1);
      return;
    }

    setQuantity((current) => Math.min(Math.max(1, current), selectedAvailableStock));
  }, [selectedAvailableStock]);

  useEffect(() => {
    if (!galleryImages.length) return;
    if (!selectedImage || !galleryImages.includes(selectedImage)) {
      setSelectedImage(galleryImages[0]);
    }
  }, [galleryImages, selectedImage]);

  if (!productSlug) {
    return null;
  }

  const { allUniqueColors, allSizesForDisplay, colorToAvailableSizesMap } =
    React.useMemo(() => {
      const colors: { name: string; image: string }[] = [];
      const sizeNames = new Set<string>();
      const sizesByColor = new Map<string, Set<string>>();

      product?.variants?.forEach((v) => {
        if (
          v.color &&
          typeof v.color === "object" &&
          v.color.name &&
          !colors.some((c) => c.name === v.color!.name)
        ) {
          colors.push({
            name: v.color!.name,
            image: getApiImageUrl(v.v_image, getProductImageUrl(product)),
          });
        }

        if (Array.isArray(v.sizes)) {
          v.sizes.forEach((s) => {
            if (s?.name) {
              sizeNames.add(s.name);
              if (
                v.color &&
                typeof v.color === "object" &&
                v.color.name &&
                s.stock > 0
              ) {
                if (!sizesByColor.has(v.color!.name)) {
                  sizesByColor.set(v.color!.name, new Set<string>());
                }
                sizesByColor.get(v.color!.name)?.add(s.name);
              }
            }
          });
        }
      });

      return {
        allUniqueColors: colors,
        allSizesForDisplay: Array.from(sizeNames),
        colorToAvailableSizesMap: sizesByColor,
      };
    }, [product]);

  const hasDescription = Boolean(product?.shortDescription?.trim());
  const hasColors = allUniqueColors.length > 0;
  const hasSizes = allSizesForDisplay.length > 0;

  const handleColorChange = React.useCallback((color: { name: string; image: string }) => {
    setSelectedColor(color.name);
    const nextVariant =
      product?.variants.find((variant) => variant.color?.name === color.name) ||
      null;
    setSelectedVariantId(nextVariant?._id || "");
    const nextGallery = getVariantGalleryUrls(product, nextVariant);
    setSelectedImage(nextGallery[0] || color.image);

    const availableSizesForNewColor = colorToAvailableSizesMap.get(color.name);
    if (
      selectedSize &&
      availableSizesForNewColor &&
      !availableSizesForNewColor.has(selectedSize)
    ) {
      setSelectedSize("");
    }
    if (
      !selectedSize &&
      availableSizesForNewColor &&
      availableSizesForNewColor.size > 0
    ) {
      setSelectedSize(Array.from(availableSizesForNewColor)[0]);
    }
  }, [colorToAvailableSizesMap, product, selectedSize]);

  const handleViewSimilar = React.useCallback(() => {
    if (!product) return;
    onClose();
    router.push(buildProductHref(product, { scroll: "similar" }));
  }, [onClose, product, router]);

  const handleToggleWishlist = React.useCallback(() => {
    if (!product) return;
    toggleProductInWishlist(product._id);
  }, [product, toggleProductInWishlist]);

  return (
    <div
      className="fixed inset-0 z-[1005] flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl bg-white rounded-lg shadow-lg overflow-hidden"
        style={{ maxHeight: "95vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          className="absolute cursor-pointer top-3 right-3 text-gray-500 border border-gray-300 w-8 h-8 flex items-center justify-center hover:text-gray-700 text-xl font-bold z-10 bg-white"
          onClick={onClose}
        >
          <span className="mb-1">&times;</span>
        </button>

        <div className="overflow-y-auto" style={{ maxHeight: "95vh" }}>
          {loading ? (
            <div className="flex justify-center items-center h-96">
              <div className="w-16 h-16 border-4 border-[#bd9951] border-dashed rounded-full animate-spin" />
            </div>
          ) : product ? (
            <div className="flex flex-col sm:flex-row">
              {/* Left — image gallery, no padding so it bleeds to edge */}
              <QuickViewMedia
                images={galleryImages}
                selectedImage={selectedImage || galleryImages[0]}
                onImageChange={setSelectedImage}
                title={product.name}
                isWishlisted={isProductInWishlist(product._id)}
                onToggleWishlist={handleToggleWishlist}
                onScrollToSimilar={handleViewSimilar}
              />

              {/* Right — product details */}
              <div className="w-full sm:w-[48%] flex flex-col text-left p-6 px-10 gap-4">
                {/* Name */}
                <h2 className="font-normal text-[#683e14] mb-3 font-[family-name:var(--font-optima)] leading-snug">
                  {product.name}
                </h2>

                {/* Rating */}
                <div className="flex items-center gap-4 mb-2">
                  <StarRating rating={product.averageRating || 0} />
                </div>

                {/* Product code */}
                <div className="text-[#005648] text-[15px] mb-2">
                  <span className="font-bold">Product Code:</span>{" "}
                  {product.sku}
                </div>

                {/* Short desc */}
                {hasDescription && (
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {product.shortDescription}
                  </p>
                )}

                {/* Price */}
                <div className="mb-4 pb-4 border-b border-gray-100">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="text-[22px] font-[family-name:var(--font-montserrat)]">
                      ₹ {displayPrice.toFixed(2)}
                    </span>
                    {displayOriginalPrice > displayPrice && (
                      <span className="text-[16px] text-gray-400 line-through font-[family-name:var(--font-montserrat)]">
                        ₹ {displayOriginalPrice.toFixed(2)}
                      </span>
                    )}
                    {discount > 0 && (
                      <span className="text-[15px] text-[#6a3f0e] font-semibold font-[family-name:var(--font-montserrat)]">
                        Save {discount}%
                      </span>
                    )}
                  </div>
                  <p className="text-[12px] text-gray-400 mt-1 font-[family-name:var(--font-montserrat)]">
                    Inclusive of all taxes.
                  </p>
                </div>

                {/* Color */}
                {hasColors && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                      Select Color:
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {allUniqueColors.map((color, i: number) => (
                        <div
                          key={i}
                          className={`w-10 h-14 md:w-12 md:h-16 border cursor-pointer hover:border-[#bd9951] p-0.5 relative flex-shrink-0 ${
                            selectedColor === color.name
                              ? "border-[#bd9951]"
                              : "border-gray-200"
                          }`}
                          onClick={() => handleColorChange(color)}
                        >
                          <Image
                            src={color.image}
                            alt={color.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Size */}
                {hasSizes && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                      Select Size:
                    </label>
                    <div className="flex flex-wrap gap-3">
                      {allSizesForDisplay.map((sizeName) => {
                        const isAvailableForSelectedColor =
                          colorToAvailableSizesMap
                            .get(selectedColor)
                            ?.has(sizeName);
                        const isDisabled = !isAvailableForSelectedColor;
                        const selectedVariant = product.variants.find(
                          (v) => v.color?.name === selectedColor,
                        );
                        const stock =
                          selectedVariant?.sizes.find((s) => s.name === sizeName)
                            ?.stock ?? 0;

                        return (
                          <div
                            key={sizeName}
                            className="flex flex-col items-center gap-1"
                          >
                            <button
                              disabled={isDisabled}
                              onClick={() => setSelectedSize(sizeName)}
                              className={`
                            ${sizeName === "One Size" ? "px-3 py-2 rounded-md" : "w-9 h-9 md:w-10 md:h-10 rounded-full"}
                            flex items-center justify-center border text-xs md:text-sm font-medium transition-colors relative overflow-hidden
                            ${isDisabled ? "bg-gray-100 text-gray-400 cursor-not-allowed" : ""}
                            ${selectedSize === sizeName && !isDisabled ? "border-[#bd9951]" : "border-gray-300 text-gray-700 hover:border-[#bd9951] cursor-pointer"}
                          `}
                            >
                              {sizeName}
                              {isDisabled && (
                                <div className="absolute w-full h-px bg-gray-400 transform rotate-45" />
                              )}
                            </button>
                            {!(product.stock <= 0) &&
                              isAvailableForSelectedColor &&
                              stock <= 5 &&
                              stock > 0 && (
                                <span className="text-[9px] bg-[#f5a623] text-white px-1.5 py-0.5 rounded-sm font-semibold whitespace-nowrap">
                                  {stock} left
                                </span>
                              )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="pt-2">
                  <div className="flex gap-3 items-center">
                    <input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => handleQuantityChange(e.target.value)}
                      className="w-16 h-11 border border-gray-300 text-center focus:outline-none focus:border-[#bd9951]"
                    />
                    <button
                      onClick={handleAddToCart}
                      className="flex-1 h-11 bg-white border border-[#fe5722] text-[#fe5722] uppercase text-sm font-medium tracking-wider hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      Add to Cart
                    </button>
                    <button
                      onClick={handleBuyNow}
                      className="flex-1 h-11 bg-[#fe5722] text-white uppercase text-sm font-medium tracking-wider cursor-pointer transition-colors"
                    >
                      Buy Now
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">Product not found</div>
          )}
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

export default QuickView;
