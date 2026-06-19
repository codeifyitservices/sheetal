"use client";

import React, { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getOrderById } from "../../services/orderService";
import { getBasicInfo } from "../../services/basicInfoService";
import { getSettings, getLogoUrl } from "../../services/settingsService";
import { useSettings } from "../../hooks/useSettings";
import { logout } from "../../services/authService";

import Cookies from "js-cookie";

interface OrderItem {
  _id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  product: {
    _id: string;
    slug: string;
    category?: {
      name: string;
      hsnCode: string;
    };
  };
  variant?: {
    size?: string;
    color?: string;
    v_sku?: string;
  };
}

interface Order {
  _id: string;
  orderId: string;
  orderItems: OrderItem[];
  itemsPrice: number;
  totalPrice: number;
  discountPrice: number;
  platformFee: number;
  shippingPrice: number;
  taxPrice: number;
  paymentInfo: {
    status: string;
    method: string;
    displayMethod?: string;
  };
  orderStatus: string;
  shippingAddress: {
    fullName: string;
    addressLine1: string;
    city: string;
    state: string;
    postalCode: string;
    phoneNumber: string;
  };
  createdAt: string;
}

const InvoicePageInner = () => {
  const { settings: brandSettings } = useSettings();
  const logoUrl = getLogoUrl(brandSettings);
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  const [order, setOrder] = useState<Order | null>(null);
  const [basicInfo, setBasicInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!orderId) {
        setError("Order ID is missing");
        setLoading(false);
        return;
      }

      try {
        const [orderRes, infoRes] = await Promise.all([
          getOrderById(orderId),
          getBasicInfo(),
        ]);

        if (orderRes.success) {
          setOrder(orderRes.data);
        } else {
          setError(orderRes.message || "Failed to load order");
        }

        if (infoRes.success) {
          setBasicInfo(infoRes.data);
        }
      } catch (err) {
        setError("An error occurred while fetching data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [orderId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white">
        <div className="w-12 h-12 border-4 border-[#bd9951] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-600">Loading invoice...</p>
      </div>
    );
  }

  if (error || !order || !basicInfo) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white p-4">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
        <p className="text-gray-600 mb-6">{error || "Data not found"}</p>
        <Link
          href="/"
          className="px-6 py-2 bg-[#bd9951] text-white rounded-md hover:bg-[#a68646] transition-colors"
        >
          Go Back Home
        </Link>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 print:bg-white print:py-0 print:px-0 font-montserrat">
      <div className="max-w-4xl mx-auto bg-white shadow-lg p-8 print:shadow-none print:max-w-none">
        {/* Actions - Hidden on print */}
        <div className="flex justify-end gap-4 mb-8 print:hidden">
          <button
            onClick={() => router.back()}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
          >
            Back
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-black transition-colors flex items-center gap-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
              />
            </svg>
            Print
          </button>
        </div>

        {/* Invoice Header */}
        <div className="border-b-2 border-gray-100 pb-8 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start gap-6">
            <div className="w-full md:w-1/2">
              <div className="mb-4">
                <Image
                  src={logoUrl}
                  alt="Studio By Sheetal"
                  width={150}
                  height={60}
                  className="h-15 w-auto object-contain"
                />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Studio By Sheetal
              </h2>
              <div className="text-gray-600 text-sm space-y-1">
                <p>{basicInfo.address?.addressLine}</p>
                <p>
                  {basicInfo.address?.city}, {basicInfo.address?.state} -{" "}
                  {basicInfo.address?.pincode}
                </p>
                <p>GSTIN: {basicInfo.gstNumber}</p>
                <p>Email: {basicInfo.email}</p>
                <p>Phone: {basicInfo.phone}</p>
              </div>
            </div>
            <div className="w-full md:w-1/2 md:text-right">
              <h1 className="text-3xl font-bold text-gray-900 mb-4 uppercase tracking-tighter">
                Tax Invoice
              </h1>
              <div className="text-gray-600 text-sm space-y-1 inline-block text-left md:text-right">
                <p>
                  <span className="font-semibold text-gray-900">
                    Invoice No:
                  </span>{" "}
                  #{order.orderId}
                </p>
                <p>
                  <span className="font-semibold text-gray-900">Date:</span>{" "}
                  {new Date(order.createdAt).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
                <p>
                  <span className="font-semibold text-gray-900">
                    Payment Status:
                  </span>{" "}
                  <span
                    className={
                      order.paymentInfo.status === "Paid"
                        ? "text-green-600"
                        : "text-red-600"
                    }
                  >
                    {order.paymentInfo.status}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Billing & Shipping */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
              Bill To
            </h3>
            <div className="text-gray-900 space-y-1">
              <p className="font-bold text-lg">
                {order.shippingAddress.fullName}
              </p>
              <p className="text-gray-600 text-sm">
                {order.shippingAddress.addressLine1}
              </p>
              <p className="text-gray-600 text-sm">
                {order.shippingAddress.city}, {order.shippingAddress.state} -{" "}
                {order.shippingAddress.postalCode}
              </p>
              <p className="text-gray-600 text-sm">
                Phone: {order.shippingAddress.phoneNumber}
              </p>
            </div>
          </div>
          <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
              Ship To
            </h3>
            <div className="text-gray-900 space-y-1">
              <p className="font-bold text-lg">
                {order.shippingAddress.fullName}
              </p>
              <p className="text-gray-600 text-sm">
                {order.shippingAddress.addressLine1}
              </p>
              <p className="text-gray-600 text-sm">
                {order.shippingAddress.city}, {order.shippingAddress.state} -{" "}
                {order.shippingAddress.postalCode}
              </p>
              <p className="text-gray-600 text-sm">
                Phone: {order.shippingAddress.phoneNumber}
              </p>
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="mb-8">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-100">
                <th className="py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">
                  Description
                </th>
                <th className="py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">
                  Qty
                </th>
                <th className="py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">
                  Price
                </th>
                <th className="py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {order.orderItems.map((item) => (
                <tr key={item._id}>
                  <td className="py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-16 relative flex-shrink-0 bg-gray-100 rounded overflow-hidden print:hidden">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{item.name}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          SKU: {item.variant?.v_sku || "N/A"} | HSN:{" "}
                          {item.product?.category?.hsnCode || basicInfo.globalHsnCode}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 text-center font-medium text-gray-900">
                    {item.quantity}
                  </td>
                  <td className="py-4 text-right font-medium text-gray-900">
                    ₹{item.price.toLocaleString("en-IN")}
                  </td>
                  <td className="py-4 text-right font-bold text-gray-900">
                    ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex flex-col md:flex-row justify-between gap-8 pt-8 border-t-2 border-gray-100">
          <div className="w-full md:w-1/2">
            <div className="bg-amber-50 p-4 rounded-lg border border-amber-100 mb-4 print:hidden">
              <p className="text-amber-800 text-xs font-medium leading-relaxed">
                Thank you for shopping with Studio By Sheetal! For returns or
                exchanges, please visit our policy page.
              </p>
            </div>
            <div className="text-gray-400 text-[10px] uppercase tracking-widest font-bold">
              Terms & Conditions
            </div>
            <p className="text-gray-500 text-[10px] mt-2 leading-relaxed">
              1. All disputes are subject to Delhi Jurisdiction.<br />
              2. Goods once sold will only be exchanged according to company
              policy.<br />
              3. This is a computer generated invoice.
            </p>
          </div>
          <div className="w-full md:w-1/2">
            <div className="space-y-3">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span>
                <span>₹{order.itemsPrice.toLocaleString("en-IN")}</span>
              </div>
              {order.discountPrice > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount</span>
                  <span>- ₹{order.discountPrice.toLocaleString("en-IN")}</span>
                </div>
              )}
              <div className="flex justify-between text-sm text-gray-600">
                <span>GST (Included)</span>
                <span>₹{order.taxPrice.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Shipping Fee</span>
                <span>
                  {order.shippingPrice === 0
                    ? "FREE"
                    : `₹${order.shippingPrice.toLocaleString("en-IN")}`}
                </span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Platform Fee</span>
                <span>₹{order.platformFee?.toLocaleString("en-IN")}</span>
              </div>
              <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
                <span className="text-lg font-bold text-gray-900">Total</span>
                <span className="text-2xl font-black text-[#bd9951]">
                  ₹{order.totalPrice.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gray-50 text-center">
          <p className="text-xs text-gray-400 font-medium">
            © {new Date().getFullYear()} Studio By Sheetal. All Rights Reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

const InvoicePage = () => {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center min-h-screen bg-white">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-[#bd9951] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading invoice...</p>
          </div>
        </div>
      }
    >
      <InvoicePageInner />
    </Suspense>
  );
};

export default InvoicePage;
