"use client";
import React from "react";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import toast from "react-hot-toast";
import StarRating from "./StarRating";
import { ProductVariant } from "../../services/productService";
import { getApiImageUrl } from "../../services/api";

interface ProductInfoProps {
  product: {
    title: string;
    rating: number;
    productCode: string;
    mainDescription: string;
    selectedPrice: number;
    selectedOriginalPrice: number;
    selectedDiscount: string;
    description: string;
    colors: { name: string; image: string }[];
    allSizes: { name: string; available: boolean; left: number }[];
    colorToAvailableSizesMap: { [colorName: string]: string[] };
    specifications: { key: string; value: string }[];
  };
  selectedSize: string;
  setSelectedSize: (size: string) => void;
  selectedColor: string;
  onBuyNow: () => void;
  onColorChange: (color: { name: string; image: string }) => void;
  quantity: number;
  setQuantity: (qty: number) => void;
  maxQuantity: number;
  onQuantityLimitReached?: (count: number) => void;
  onEnquire: () => void;
  onSizeChartOpen: () => void;
  onAddToCart: () => void;
  pincode: string;
  setPincode: (pin: string) => void;
  pincodeMessage: string;
  checkPincode: () => void;
  hasSizeChart?: boolean;
  isOutOfStock: boolean;
  selectedVariantData?: ProductVariant | null;
  selectedVariantSizes?: ProductVariant["sizes"];
  settings?: any;
}

function AccordionSection({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const contentRef = useRef<HTMLDivElement>(null);
  const [maxHeight, setMaxHeight] = useState(defaultOpen ? "0px" : "0px");

  useEffect(() => {
    const node = contentRef.current;
    if (!node) return;

    if (open) {
      setMaxHeight(`${node.scrollHeight}px`);
      return;
    }

    setMaxHeight(`${node.scrollHeight}px`);
    let secondFrame = 0;
    const firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => {
        setMaxHeight("0px");
      });
    });

    return () => {
      window.cancelAnimationFrame(firstFrame);
      window.cancelAnimationFrame(secondFrame);
    };
  }, [open]);

  return (
    <div className="border-b border-gray-200 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between cursor-pointer bg-gray-100 px-2 py-2 text-[15px] font-semibold uppercase text-[#ff5722] transition-colors"
        aria-expanded={open}
      >
        <span>{title}</span>
        <span className="text-xl font-semibold leading-none">
          {open ? "-" : "+"}
        </span>
      </button>
      <div
        style={{
          maxHeight,
          overflow: "hidden",
          transition: "max-height 320ms ease-in-out",
          willChange: "max-height",
        }}
      >
        <div ref={contentRef} className="bg-gray-50 p-3 text-sm md:p-4">
          {children}
        </div>
      </div>
    </div>
  );
}

const ProductInfo: React.FC<ProductInfoProps> = ({
  product,
  selectedSize,
  setSelectedSize,
  selectedColor,
  onColorChange,
  quantity,
  setQuantity,
  maxQuantity,
  onQuantityLimitReached,
  onEnquire,
  onSizeChartOpen,
  onAddToCart,
  onBuyNow,
  pincode,
  setPincode,
  pincodeMessage,
  checkPincode,
  hasSizeChart = false,
  isOutOfStock,
  selectedVariantData,
  selectedVariantSizes = [],
  settings,
}) => {
  const priceToDisplay = product.selectedPrice;
  const originalPriceToDisplay = product.selectedOriginalPrice;
  const discountPercentageToDisplay = product.selectedDiscount
    ? Number(product.selectedDiscount)
    : 0;
  const showStockLimitToast = (count: number) => {
    if (onQuantityLimitReached) {
      onQuantityLimitReached(count);
      return;
    }

    toast.error(`This item only has ${count} left.`);
  };

  const handleQuantityChange = (rawValue: string) => {
    const parsedQuantity = Math.max(1, parseInt(rawValue, 10) || 1);
    const normalizedMaxQuantity = Math.max(1, maxQuantity);

    if (parsedQuantity > normalizedMaxQuantity) {
      showStockLimitToast(normalizedMaxQuantity);
    }

    setQuantity(Math.min(parsedQuantity, normalizedMaxQuantity));
  };

  return (
    <div className="px-0">
      <div className="hidden lg:block mb-4">
        <h1 className="text-[26px] md:text-[30px] font-normal text-[#683e14] mb-2 font-[family-name:var(--font-optima)]">
          {product.title}
        </h1>
        <div className="flex items-center gap-4 mb-2">
          <StarRating rating={product.rating} />
        </div>
        <div className="text-emerald-900 text-[15px] hidden md:block">
          <span className="font-semibold">Product Code:</span>{" "}
          {product.productCode}
        </div>
      </div>

      <p className="text-[15px] mb-5 leading-relaxed text-gray-800 hidden md:block">
        {product.mainDescription}
      </p>

      <div className="mb-5">
        <div className="flex flex-wrap items-end gap-2 md:gap-3">
          <span className="text-[22px] font-normal">
            ₹ {priceToDisplay.toFixed(2)}
          </span>
          {originalPriceToDisplay > 0 && originalPriceToDisplay !== priceToDisplay && (
            <span className="text-[18px] text-gray-400 line-through">
              ₹ {originalPriceToDisplay.toFixed(2)}
            </span>
          )}
          {discountPercentageToDisplay > 0 && originalPriceToDisplay !== priceToDisplay && (
            <span className="text-[16px] text-[#6a3f0e] font-medium">
              Save {discountPercentageToDisplay}%
            </span>
          )}
        </div>
        <p className="text-[13px] text-gray-500 mt-1">
          Inclusive of all taxes.
        </p>
      </div>

      <div className="mb-5">
        <span
          className={`inline-block text-xs px-2 py-1 text-[15px] rounded ${
            isOutOfStock ? "text-red-700" : "text-green-700"
          }`}
        >
          {isOutOfStock ? "Out of Stock" : "In Stock"}
        </span>
      </div>

      <div className="mb-5">
        <label className="block text-[17px] font-normal text-black mb-2">
          Select Color:
        </label>
        <div className="flex flex-wrap gap-2 md:gap-3">
          {Array.isArray(product.colors) &&
            product.colors.map((color, i) => (
              <button
                type="button"
                key={`${color.name}-${i}`}
                className={`w-16 h-20 border cursor-pointer hover:border-[#bd9951] p-0.5 relative flex-shrink-0 ${
                  selectedColor === color.name
                    ? "border-[#bd9951]"
                    : "border-gray-200"
                }`}
                onClick={() => onColorChange(color)}
              >
                <Image
                  src={getApiImageUrl(color.image, "/assets/default-image.png")}
                  alt={color.name}
                  fill
                  className="object-cover"
                />
              </button>
            ))}
        </div>
      </div>

      <div className="mb-5">
        <div className="flex justify-between items-center mb-2">
          <label className="block text-[17px] font-medium text-black">
            Select Size:
          </label>
          {hasSizeChart && (
            <button
              onClick={onSizeChartOpen}
              className="flex items-center text-sm text-red-500 font-semibold hover:underline cursor-pointer"
            >
              <Image
                src="/assets/icons/measurement.svg"
                width={14}
                height={14}
                alt="ruler"
                className="mr-1"
              />
              Size Chart {">"}
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2 md:gap-3">
          {Array.isArray(product.allSizes) &&
            product.allSizes.map((size) => {
              const isAvailableForSelectedColor =
                product.colorToAvailableSizesMap[selectedColor]?.includes(
                  size.name,
                );

              const actualStock =
                isAvailableForSelectedColor && selectedVariantSizes.length > 0
                  ? selectedVariantSizes.find((s) => s.name === size.name)
                      ?.stock
                  : undefined;

              const isSoldOut = actualStock !== undefined && actualStock <= 0;
              const isDisabled = !isAvailableForSelectedColor;

              return (
                <div key={size.name} className="flex flex-col items-center">
                  <button
                    type="button"
                    disabled={isDisabled}
                    onClick={() => setSelectedSize(size.name)}
                    className={`
                      ${
                        size.name === "One Size" || size.name === "Free Size"
                          ? "px-3 py-2 rounded-md"
                          : "w-9 h-9 md:w-10 md:h-10 rounded-full"
                      }
                      flex items-center justify-center border text-xs md:text-sm font-medium transition-colors relative
                      ${isDisabled ? "bg-gray-100 text-gray-400 cursor-not-allowed" : ""}
                      ${
                        selectedSize === size.name && !isDisabled
                          ? "border-[#bd9951] text-[#bd9951]"
                          : "border-gray-300 text-gray-700 hover:border-[#bd9951] cursor-pointer"
                      }
                    `}
                  >
                    {size.name}
                    {(isDisabled || isSoldOut) && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div
                          className={`w-full h-px bg-gray-400 transform ${size.name === "One Size" || size.name === "Free Size" ? "rotate-25" : "rotate-45"}`}
                        />
                      </div>
                    )}
                  </button>

                  {!isOutOfStock &&
                    actualStock !== undefined &&
                    actualStock <= 5 &&
                    actualStock > 0 && (
                      <span className="text-[9px] -mt-2 z-2 md:text-[10px] bg-[#f5a623] text-white px-1.5 py-0.5 rounded-sm font-semibold whitespace-nowrap">
                        {actualStock} left
                      </span>
                    )}
                </div>
              );
            })}
        </div>
      </div>

      <div className="flex flex-col lg:hidden mb-5 border-b border-gray-100 pb-5 space-y-3">
        {isOutOfStock ? (
          <button
            onClick={onEnquire}
            className="text-[#bd9951] border border-[#bd9951] px-4 py-2 text-sm font-medium rounded-sm hover:bg-[#bd9951] hover:text-white transition-colors w-full"
          >
            Notify Me
          </button>
        ) : (
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => handleQuantityChange(e.target.value)}
            className="w-full h-10 border border-gray-300 px-3 text-sm focus:outline-none focus:border-[#bd9951]"
          />
        )}
      </div>

      <div className="mb-6 hidden lg:block">
        {isOutOfStock ? (
          <button
            onClick={onEnquire}
            className="text-[#bd9951] border p-3 text-sm font-medium hover:bg-gray-100 cursor-pointer flex items-center w-full justify-center"
          >
            Notify Me
          </button>
        ) : (
          <div className="flex flex-col gap-3 items-start">
            <div className="w-20 md:w-24">
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => handleQuantityChange(e.target.value)}
                className="w-full h-10 border border-gray-300 text-left px-4 focus:outline-none focus:border-[#bd9951]"
              />
            </div>
            <div className="flex gap-5 w-[450px]">
              <button
                onClick={onAddToCart}
                className="flex-1 h-12 bg-white border rounded-md border-[#ff5722] text-[#ff5722] uppercase tracking-wider hover:bg-gray-100 cursor-pointer transition-colors text-[17px] font-semibold"
              >
                Add to Cart
              </button>
              <button
                onClick={onBuyNow}
                disabled={!selectedSize}
                className="flex-1 h-12 bg-[#ff5722] rounded-md text-white border border-[#bd9951] uppercase font-medium tracking-wider cursor-pointer transition-colors shadow-lg text-[17px] font-semibold disabled:opacity-60"
              >
                Buy Now
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 w-full bg-white z-[100] border-t border-gray-200 px-3 py-2 lg:hidden flex gap-2 items-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
        <div className="flex flex-col shrink-0">
          <span className="text-base font-bold leading-tight">
            ₹ {priceToDisplay.toFixed(2)}
          </span>
          {originalPriceToDisplay > 0 && originalPriceToDisplay !== priceToDisplay && (
            <span className="text-xs text-gray-400 line-through">
              ₹ {originalPriceToDisplay.toFixed(2)}
            </span>
          )}
        </div>
        <div className="flex gap-2 flex-1 justify-end">
          {isOutOfStock ? (
            <button
              onClick={onEnquire}
              className="flex-1 bg-[#bd9951] text-white uppercase font-bold text-xs py-3 rounded-sm hover:bg-[#a38547] transition-colors"
            >
              Notify Me
            </button>
          ) : (
            <>
              <button
                onClick={onAddToCart}
                className="flex-1 bg-white border border-[#fe5722] text-[#fe5722] uppercase font-bold text-xs py-3 rounded-sm"
              >
                Add to Cart
              </button>
              <button
                onClick={onBuyNow}
                disabled={!selectedSize}
                className="flex-1 bg-[#fe5722] text-white uppercase font-bold text-xs py-3 rounded-sm disabled:opacity-60"
              >
                Buy Now
              </button>
            </>
          )}
        </div>
      </div>

      <div className="mb-5 border-t border-gray-100 pt-5">
        <label className="flex items-center text-[17px] font-semibold mb-3">
          Delivery Options
          <Image
            src="/assets/icons/delivery-truck.svg"
            width={18}
            height={18}
            alt="truck"
            className="w-7 h-7 ml-2"
          />
        </label>
        <div className="flex relative h-12 max-w-72 mb-2">
          <input
            type="text"
            placeholder="Enter pincode"
            value={pincode}
            onChange={(e) =>
              setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))
            }
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            className="w-full h-10 border rounded-lg border-gray-300 px-3 text-sm focus:outline-none focus:border-[#bd9951]"
          />
          <button
            onClick={checkPincode}
            className="absolute right-0 rounded-r-lg bg-gray-100 border border-gray-300 top-0 h-10 px-3 text-[#fe5722] font-semibold text-sm hover:bg-gray-50 cursor-pointer"
          >
            Check
          </button>
        </div>
        <div className="text-[13px] my-2 font-medium w-full">
          Please enter PIN code to check delivery time & Pay on Delivery
          Availability
        </div>
        {pincodeMessage && (
          <p
            className={`text-xs ${
              pincodeMessage.includes("valid")
                ? "text-red-500"
                : "text-green-600"
            }`}
          >
            {pincodeMessage}
          </p>
        )}
        <div className="mt-4 space-y-2">
          {[
            { icon: "delivery-truck.svg", text: "Get it by Tue, Jan 06" },
            {
              icon: "cash-on-delivery.svg",
              text: settings?.deliveryPoint2 || "Pay on delivery available",
            },
            {
              icon: "product-return.svg",
              text: settings?.deliveryPoint3 || "Easy 7 days return & exchange available",
            },
          ].map(({ icon, text }) => (
            <div key={icon} className="flex items-center text-[15px] gap-3">
              <Image
                src={`/assets/icons/${icon}`}
                width={38}
                height={38}
                alt={icon}
                className="shrink-0"
              />
              <span>{text}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 px-1 text-gray-800">100% Original Products</div>
      </div>

      <div className="rounded mt-2">
        <AccordionSection title="Specifications" defaultOpen>
          {Array.isArray(product.specifications) &&
          product.specifications.length > 0 ? (
            <div className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2 md:gap-x-8">
              {product.specifications.map((spec, idx) => (
                <div
                  key={`${spec.key}-${idx}`}
                  className="flex flex-col border-b border-gray-200 pb-2"
                >
                  <span className="font-semibold text-gray-700 text-xs md:text-[15px]">
                    {spec.key}
                  </span>
                  <span className="text-gray-900 text-xs md:text-[16px]">
                    {spec.value}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm italic text-gray-500">
              No specifications available.
            </p>
          )}
        </AccordionSection>

        <AccordionSection title="Delivery & Returns">
          <h3 className="mb-3 font-semibold text-gray-900">
            Available Shipping Methods
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs md:text-sm">
              <thead>
                <tr className="border-b font-bold">
                  <th className="pb-1 pr-4 text-left">Shipping Method</th>
                  <th className="pb-1 pr-4 text-left">Shipping To</th>
                  <th className="pb-1 text-left">Shipping Charge</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-2 pr-4">Pre-Paid</td>
                  <td className="py-2 pr-4">All over India</td>
                  <td className="py-2">{settings?.prepaidShippingCharge || "Free Shipping"}</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 pr-4">COD Charges</td>
                  <td className="py-2 pr-4">All over India</td>
                  <td className="py-2">{settings?.codShippingCharge || "Free Shipping"}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs font-semibold md:text-sm">
            For more details please read{" "}
            <Link
              href="/shipping-policy"
              className="text-gray-900 underline hover:text-black"
            >
              Shipping Policy
            </Link>
            .
          </p>
          <h3 className="mb-1 mt-4 text-xs font-semibold text-gray-900 md:text-sm">
            Return Policy
          </h3>
          <p className="text-xs leading-relaxed md:text-sm">
            {settings?.returnPolicyContent || "Your satisfaction is our top priority. If you're not completely satisfied with the product, we offer a hassle-free, no questions asked 7 days return and refund."}
          </p>
          <p className="mt-2 text-xs md:text-sm">
            For more details please read{" "}
            <Link
              href="/return-and-cancellation-policy"
              className="text-gray-900 underline hover:text-black"
            >
              Return and Cancellation Policy
            </Link>
            .
          </p>
        </AccordionSection>
      </div>

      <div className="mt-5 p-4 md:p-6 border">
        <h4 className="font-semibold text-gray-800 mb-3 text-sm md:text-base">
          Have a question? We are here to help!
        </h4>
        <div className="flex flex-col gap-3 text-sm">
          <a
            href={`mailto:${settings?.supportEmail || "info@studiobysheetal.com"}`}
            className="flex items-center hover:text-[#5f3c20] gap-2"
          >
            <Image
              src="/assets/icons/email.svg"
              width={27}
              height={27}
              alt="email"
            />
            <span className="break-all text-[15px]">
              Email us at {settings?.supportEmail || "info@studiobysheetal.com"}
            </span>
          </a>
          <a
            href={`https://wa.me/${settings?.supportWhatsapp || "919958813913"}`}
            className="flex items-center hover:text-[#5f3c20] border w-fit px-3 py-2 font-semibold gap-2"
          >
            <Image
              src="/assets/icons/whatsapp.svg"
              width={27}
              height={27}
              alt="wa"
            />
            <span className="text-[15px]">Click to chat</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default ProductInfo;
