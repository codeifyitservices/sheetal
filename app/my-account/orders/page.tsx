"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { getMyOrders } from "../../services/orderService";
import { getApiImageUrl } from "../../services/api";
import { buildProductHref } from "../../utils/productRoutes";

// ─── Types ────────────────────────────────────────────────────────────────────

type OrderStatus =
  | "Processing"
  | "Shipped"
  | "Delivered"
  | "Cancelled"
  | "Returned"
  | "Exchanged"
  | "Return Requested";

/** Shape of a single item inside an order (as returned by backend) */
interface RawOrderItem {
  _id: string;
  product: string | null;
  name: string;
  image: string;
  price: number;
  quantity: number;
  variant?: {
    size?: string;
    color?: string;
    v_sku?: string;
  };
}

/** Shape of an Order document returned from GET /orders/my-orders */
interface RawOrder {
  _id: string;
  orderItems: RawOrderItem[];
  orderStatus: OrderStatus;
  totalPrice: number;
  itemsPrice: number;
  shippingPrice: number;
  taxPrice: number;
  paymentInfo: {
    id?: string;
    status?: string;
    method: "COD" | "Online";
  };
  shippingAddress: {
    fullName: string;
    phoneNumber: string;
    addressLine1: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  trackingId?: string;
  courierPartner?: string;
  awbCode?: string;
  deliveredAt?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

const normalizeOrderStatus = (status: string): OrderStatus => {
  switch (status) {
    case "Processing":
    case "Shipped":
    case "Delivered":
    case "Cancelled":
    case "Returned":
    case "Exchanged":
    case "Return Requested":
      return status;
    default:
      return "Processing";
  }
};

/** Normalised UI shape (one "order card" per RawOrder) */
interface UIOrder {
  id: string;
  orderId: string;
  placedAt: string;
  status: OrderStatus;
  totalPrice: number;
  paymentMethod: string;
  trackingId?: string;
  deliveredAt?: string;
  items: UIOrderItem[];
}

interface UIOrderItem {
  id: string;
  productId: string | null;
  name: string;
  image: string;
  color: string;
  size: string;
  price: number;
  quantity: number;
}

// ─── Backend → UI normaliser ─────────────────────────────────────────────────

/**
 * Maps a raw API Order document to the flat UIOrder shape used by the page.
 */
const normaliseOrder = (raw: RawOrder): UIOrder => ({
  id: raw._id,
  orderId: raw._id.slice(-10).toUpperCase(), // last 10 chars for display
  placedAt: raw.createdAt,
  status: normalizeOrderStatus(raw.orderStatus),
  totalPrice: raw.totalPrice,
  paymentMethod: raw.paymentInfo.method,
  trackingId: raw.trackingId,
  deliveredAt: raw.deliveredAt,
  items: raw.orderItems.map((item) => ({
    id: item._id,
    productId: item.product,
    name: item.name,
    image: getApiImageUrl(item.image),
    color: item.variant?.color || "—",
    size: item.variant?.size || "—",
    price: item.price,
    quantity: item.quantity,
  })),
});

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; textColor: string; bgColor: string }
> = {
  Processing: {
    label: "Processing",
    textColor: "text-amber-700",
    bgColor: "bg-amber-50",
  },
  Shipped: {
    label: "Shipped",
    textColor: "text-blue-700",
    bgColor: "bg-blue-50",
  },
  Delivered: {
    label: "Delivered",
    textColor: "text-green-700",
    bgColor: "bg-green-50",
  },
  Cancelled: {
    label: "Cancelled",
    textColor: "text-red-600",
    bgColor: "bg-red-50",
  },
  Returned: {
    label: "Returned",
    textColor: "text-gray-600",
    bgColor: "bg-gray-100",
  },
  Exchanged: {
    label: "Exchanged",
    textColor: "text-purple-700",
    bgColor: "bg-purple-50",
  },
  "Return Requested": {
    label: "Return Requested",
    textColor: "text-orange-700",
    bgColor: "bg-orange-50",
  },
};

const TIME_FILTER_OPTIONS = [
  { value: "all", label: "Any time" },
  { value: "3", label: "Last 3 months" },
  { value: "6", label: "Last 6 months" },
  { value: "12", label: "Last 1 year" },
  { value: "24", label: "Last 2 years" },
];

const STATUS_FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All Orders" },
  { value: "Processing", label: "Processing" },
  { value: "Shipped", label: "Shipped" },
  { value: "Delivered", label: "Delivered" },
  { value: "Cancelled", label: "Cancelled" },
  { value: "Returned", label: "Returned" },
  { value: "Return Requested", label: "Return Requested" },
];

const PAGE_SIZE = 10;

// ─── Formatters ───────────────────────────────────────────────────────────────

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const fmtDelivery = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

// ─── Icons ────────────────────────────────────────────────────────────────────

const TruckIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="text-blue-500 shrink-0"
  >
    <rect x="1" y="3" width="15" height="13" rx="1" />
    <path d="M16 8h4l3 5v3h-7V8z" />
    <circle cx="5.5" cy="18.5" r="2.5" />
    <circle cx="18.5" cy="18.5" r="2.5" />
  </svg>
);

const DeliveredIcon = () => (
  <svg width="24" height="24" viewBox="0 0 64 64" className="shrink-0">
    <path
      d="M53.5 36.65V18a1 1 0 0 0-.5-.87l-24.25-14a1 1 0 0 0-1 0l-24.25 14A1 1 0 0 0 3 18v28a1 1 0 0 0 .5.87l24.25 14a1 1 0 0 0 1 0l9.11-5.26a12.74 12.74 0 1 0 15.64-19zM28.25 5.15 50.5 18l-11.16 6.44-20.66-13.76zm0 25.7L6 18l10.75-6.21L37.4 25.56zM5 19.73l22.25 12.85v25.69L5 45.42zm24.25 38.54V32.58l9-5.23v7.79a1 1 0 0 0 2 0V26.2l11.2-6.47v16.21a12.44 12.44 0 0 0-3.25-.44 12.73 12.73 0 0 0-11.37 18.39zm19 .73A10.75 10.75 0 1 1 59 48.25 10.76 10.76 0 0 1 48.25 59z"
      fill="#036900"
    />
    <path
      d="m53 43.06-6.2 8.18-3.25-3.82A1 1 0 0 0 42 48.71l4 4.78a1 1 0 0 0 .76.35 1 1 0 0 0 .77-.4l6.95-9.17A1 1 0 1 0 53 43.06z"
      fill="#036900"
    />
  </svg>
);

const CancelledIcon = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    className="text-red-500 shrink-0"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="m15 9-6 6M9 9l6 6" />
  </svg>
);

const ClockIcon = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    className="text-amber-500 shrink-0"
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

// ─── Modals ───────────────────────────────────────────────────────────────────

interface ModalShellProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}
const ModalShell = ({ title, onClose, children }: ModalShellProps) => (
  <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
      <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900 text-lg">{title}</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-700 text-2xl font-bold leading-none transition-colors cursor-pointer"
          aria-label="Close"
        >
          ×
        </button>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  </div>
);

/** Track Order modal */
const TrackModal = ({
  order,
  onClose,
}: {
  order: UIOrder;
  onClose: () => void;
}) => {
  const steps = [
    { label: "Order Placed", done: true, date: fmtDate(order.placedAt) },
    { label: "Packed & Ready", done: order.status !== "Processing", date: "" },
    {
      label: "Shipped",
      done: ["Shipped", "Delivered"].includes(order.status),
      date: "",
    },
    {
      label: "Out for Delivery",
      done: order.status === "Delivered",
      date: "",
    },
    {
      label: "Delivered",
      done: order.status === "Delivered",
      date: order.deliveredAt ? fmtDate(order.deliveredAt) : "",
    },
  ];

  return (
    <ModalShell title="Track Order" onClose={onClose}>
      {order.trackingId && (
        <p className="text-sm text-gray-500 mb-4">
          Tracking No:{" "}
          <span className="font-semibold text-gray-800">{order.trackingId}</span>
        </p>
      )}
      <div className="space-y-4">
        {steps.map((step, i) => (
          <div key={i} className="flex items-start gap-3">
            <div
              className={`mt-0.5 w-5 h-5 rounded-full shrink-0 border-2 flex items-center justify-center ${step.done
                ? "border-[#a97f0f] bg-[#a97f0f]"
                : "border-gray-300 bg-white"
                }`}
            >
              {step.done && (
                <svg
                  width="9"
                  height="8"
                  viewBox="0 0 10 8"
                  fill="none"
                >
                  <path
                    d="M1 4l3 3 5-6"
                    stroke="white"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
            <div>
              <p
                className={`text-sm font-medium ${step.done ? "text-gray-900" : "text-gray-400"}`}
              >
                {step.label}
              </p>
              {step.date && (
                <p className="text-xs text-gray-400">{step.date}</p>
              )}
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={onClose}
        className="mt-6 w-full py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition cursor-pointer"
      >
        Close
      </button>
    </ModalShell>
  );
};

/** Cancel Order confirmation modal */
const CancelModal = ({
  order,
  onClose,
}: {
  order: UIOrder;
  onClose: () => void;
}) => (
  <ModalShell title="Cancel Order" onClose={onClose}>
    <p className="text-sm text-gray-600 mb-2">
      Are you sure you want to cancel order{" "}
      <span className="font-semibold text-gray-900">#{order.orderId}</span>?
    </p>
    <p className="text-xs text-gray-400 mb-6 leading-relaxed">
      Your request will be registered. Our customer support team will contact
      you shortly. Thank you for shopping with us.
    </p>
    <div className="flex gap-3">
      <button
        onClick={onClose}
        className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition cursor-pointer"
      >
        Keep Order
      </button>
      <button
        onClick={onClose}
        className="flex-1 py-2.5 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition cursor-pointer"
      >
        Yes, Cancel
      </button>
    </div>
  </ModalShell>
);

/** Write Review modal */
const ReviewModal = ({
  item,
  onClose,
}: {
  item: UIOrderItem;
  onClose: () => void;
}) => {
  const [hovered, setHovered] = useState(0);
  const [selected, setSelected] = useState(0);
  const [text, setText] = useState("");

  return (
    <ModalShell title="Write a Review" onClose={onClose}>
      <div className="flex gap-3 mb-5 pb-4 border-b border-gray-100">
        <div className="w-16 h-20 bg-gray-100 rounded-lg overflow-hidden shrink-0 relative">
          <Image
            src={item.image}
            alt={item.name}
            fill
            className="object-cover"
          />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2">
            {item.name}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {item.color} · Size {item.size}
          </p>
          <div className="flex gap-0.5 mt-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onMouseEnter={() => setHovered(n)}
                onMouseLeave={() => setHovered(0)}
                onClick={() => setSelected(n)}
                className="cursor-pointer hover:scale-110 transition-transform"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill={n <= (hovered || selected) ? "#FACC15" : "#D1D5DB"}
                >
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </button>
            ))}
          </div>
        </div>
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Share your experience with this product…"
        rows={4}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 resize-none focus:outline-none focus:ring-1 focus:ring-[#a97f0f] focus:border-[#a97f0f] placeholder-gray-400"
      />
      <p className="text-[10px] text-gray-400 mt-2 leading-relaxed">
        By submitting you agree to our{" "}
        <Link href="/terms-conditions" className="underline">
          Terms of Use
        </Link>{" "}
        and{" "}
        <Link href="/privacy-policy" className="underline">
          Privacy Policy
        </Link>
        .
      </p>
      <button
        onClick={onClose}
        className="mt-4 w-full py-2.5 rounded-lg bg-gray-900 text-white text-sm font-semibold hover:bg-black transition cursor-pointer"
      >
        Submit Review
      </button>
    </ModalShell>
  );
};

// ─── Order Card ───────────────────────────────────────────────────────────────

interface OrderCardProps {
  order: UIOrder;
  onTrack: () => void;
  onCancel: () => void;
  onReview: (item: UIOrderItem) => void;
}

/** Inline delivery status line shown per item, matching the reference image */
const DeliveryLine = ({ order }: { order: UIOrder }) => {
  if (order.status === "Delivered") {
    return (
      <div className="flex items-center gap-2 text-sm mb-3">
        {/* Box icon */}
        <svg width="36" height="36" viewBox="0 0 512 512" className="shrink-0" fill="#036900">
          <path d="m506.8125 95.679688-172-94.445313c-2.996094-1.644531-6.628906-1.644531-9.625 0l-64.679688 35.515625c-1.460937.40625-2.824218 1.152344-3.980468 2.183594l-103.339844 56.746094c-3.199219 1.757812-5.1875 5.117187-5.1875 8.765624v20.445313h-115.375c-5.523438 0-10 4.480469-10 10 0 5.523437 4.476562 10 10 10h115.375v36h-57.332031c-5.523438 0-10 4.480469-10 10 0 5.523437 4.476562 10 10 10h57.332031v52h-84c-5.523438 0-10 4.480469-10 10 0 5.523437 4.476562 10 10 10h84v20.449219c0 3.648437 1.988281 7.007812 5.1875 8.765625l172 94.445312c1.5.824219 3.15625 1.234375 4.8125 1.234375s3.3125-.410156 4.8125-1.234375l172-94.445312c3.199219-1.757813 5.1875-5.117188 5.1875-8.765625v-44.78125c0-5.519532-4.476562-10-10-10s-10 4.480468-10 10v38.863281l-152 83.464844v-166.078125l48.339844-26.542969v42.125c0 3.539063 1.867187 6.8125 4.910156 8.609375 1.566406.925781 3.328125 1.390625 5.089844 1.390625 1.65625 0 3.316406-.410156 4.820312-1.238281l36.859375-20.285156c3.191407-1.757813 5.175781-5.113282 5.175781-8.761719v-53.058594l46.804688-25.699219v47.210938c0 5.523437 4.476562 10 10 10s10-4.476563 10-10v-64.113282c0-3.648437-1.988281-7.007812-5.1875-8.765624zm-186.8125 275.207031-152-83.464844v-166.074219l152 83.460938zm10-183.402344-151.222656-83.039063 47.527344-26.097656 151.226562 83.039063zm68.308594-37.507813-151.226563-83.039062 16.394531-9 151.222657 83.039062zm26.886718 44.21875-16.855468 9.277344v-36.1875l16.855468-9.257812zm10.28125-64.628906-151.222656-83.039062 45.746094-25.117188 151.222656 83.035156zm0 0" />
        </svg>
        <span className="text-gray-700">
          Delivered on{" "}
          <strong className="text-gray-900">
            {order.deliveredAt ? fmtDelivery(order.deliveredAt) : "—"}
          </strong>
        </span>
      </div>
    );
  }

  if (
    order.status === "Cancelled" ||
    order.status === "Returned" ||
    order.status === "Exchanged" ||
    order.status === "Return Requested"
  ) {
    return (
      <div className="flex items-center gap-2 text-sm mb-3">
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.6" strokeLinecap="round" className="shrink-0">
          <rect x="2" y="7" width="20" height="14" rx="2" />
          <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
          <line x1="9" y1="12" x2="15" y2="12" />
        </svg>
        <span className="text-red-500 font-medium">
          Order {STATUS_CONFIG[order.status].label}
        </span>
      </div>
    );
  }

  // Processing or Shipped — show "Delivery expected by ..."
  const expectedDate = order.deliveredAt
    ? fmtDelivery(order.deliveredAt)
    : order.status === "Shipped"
      ? "in transit"
      : "soon";

  return (
    <div className="flex items-center gap-2 text-sm mb-3">
      {/* Box icon */}
      <svg width="36" height="36" viewBox="0 0 512 512" className="shrink-0" fill="#16a34a">
        <path d="m506.8125 95.679688-172-94.445313c-2.996094-1.644531-6.628906-1.644531-9.625 0l-64.679688 35.515625c-1.460937.40625-2.824218 1.152344-3.980468 2.183594l-103.339844 56.746094c-3.199219 1.757812-5.1875 5.117187-5.1875 8.765624v20.445313h-115.375c-5.523438 0-10 4.480469-10 10 0 5.523437 4.476562 10 10 10h115.375v36h-57.332031c-5.523438 0-10 4.480469-10 10 0 5.523437 4.476562 10 10 10h57.332031v52h-84c-5.523438 0-10 4.480469-10 10 0 5.523437 4.476562 10 10 10h84v20.449219c0 3.648437 1.988281 7.007812 5.1875 8.765625l172 94.445312c1.5.824219 3.15625 1.234375 4.8125 1.234375s3.3125-.410156 4.8125-1.234375l172-94.445312c3.199219-1.757813 5.1875-5.117188 5.1875-8.765625v-44.78125c0-5.519532-4.476562-10-10-10s-10 4.480468-10 10v38.863281l-152 83.464844v-166.078125l48.339844-26.542969v42.125c0 3.539063 1.867187 6.8125 4.910156 8.609375 1.566406.925781 3.328125 1.390625 5.089844 1.390625 1.65625 0 3.316406-.410156 4.820312-1.238281l36.859375-20.285156c3.191407-1.757813 5.175781-5.113282 5.175781-8.761719v-53.058594l46.804688-25.699219v47.210938c0 5.523437 4.476562 10 10 10s10-4.476563 10-10v-64.113282c0-3.648437-1.988281-7.007812-5.1875-8.765624zm-186.8125 275.207031-152-83.464844v-166.074219l152 83.460938zm10-183.402344-151.222656-83.039063 47.527344-26.097656 151.226562 83.039063zm68.308594-37.507813-151.226563-83.039062 16.394531-9 151.222657 83.039062zm26.886718 44.21875-16.855468 9.277344v-36.1875l16.855468-9.257812zm10.28125-64.628906-151.222656-83.039062 45.746094-25.117188 151.222656 83.035156zm0 0" />
      </svg>
      <span className="text-gray-700">
        Delivery expected by{" "}
        <strong className="text-[#16a34a]">{expectedDate}</strong>
      </span>
    </div>
  );
};

const OrderCard = ({ order, onTrack, onCancel, onReview }: OrderCardProps) => (
  <div className="border border-gray-400 bg-transparent mb-6 overflow-hidden rounded-md p-6">
    {/* ── Order ID strip ── */}
    <div className="flex justify-end items-center px-0 py-1.5 mb-1">
      <p className="text-xs text-gray-500">
        <span className="font-semibold text-gray-700">Order ID #</span>{" "}
        {order.id}
      </p>
    </div>

    {/* ── Per-item blocks ── */}
    {order.items.map((item, idx) => (
      <div
        key={item.id}
        className={`pt-3 pb-2 ${idx < order.items.length - 1 ? "border-b border-gray-100 mb-3" : ""}`}
      >
        {(() => {
          const productHref = item.productId
            ? buildProductHref({ _id: item.productId })
            : null;

          return (
            <>
        {/* Delivery status line */}
        <DeliveryLine order={order} />

        {/* ── Item card: white bg, rounded border ── */}
        <div className="rounded-xl border border-gray-200 overflow-hidden">
          {/* Top row: thumbnail + info + chevron */}
          <div className="flex items-center gap-3 p-3 relative">
            {/* Thumbnail — soft pink bg matching reference */}
            <div className="w-[68px] h-[80px] shrink-0 relative overflow-hidden rounded-lg bg-[#fce4ec]">
              {productHref ? (
                <Link href={productHref} className="block h-full w-full">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "/assets/images/product-placeholder.webp";
                    }}
                  />
                </Link>
              ) : (
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  className="object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "/assets/images/product-placeholder.webp";
                  }}
                />
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 pr-6">
              {productHref ? (
                <Link
                  href={productHref}
                  className="text-sm text-gray-900 line-clamp-2 leading-snug hover:text-[#bd9951] transition-colors"
                >
                  {item.name}
                </Link>
              ) : (
                <p className="text-sm text-gray-900 line-clamp-2 leading-snug">
                  {item.name}
                </p>
              )}
              <p className="text-xs text-gray-600 mt-1">
                <span className="font-semibold text-gray-900">Color:</span>{" "}
                {item.color}
                {" | "}
                <span className="font-semibold text-gray-900">Size:</span>{" "}
                {item.size}
              </p>
            </div>

            {/* Chevron */}
            <Link
              href={`/my-account/orders/${order.id}`}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
              aria-label="View order details"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            </Link>
          </div>

          {/* Action buttons row — inside the card */}
          {(order.status === "Processing" || order.status === "Shipped") && (
            <div className="flex items-center gap-3 px-3 pb-3">
              <button
                onClick={onCancel}
                className="flex-1 py-1.5 rounded border border-gray-300 bg-white text-xs font-medium text-gray-700 hover:bg-gray-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={onTrack}
                className="flex-1 py-1.5 rounded border border-gray-300 bg-white text-xs font-medium text-gray-700 hover:bg-gray-50 transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                {/* Person/location pin icon matching reference image */}
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M20 21a8 8 0 1 0-16 0" />
                </svg>
                Track
              </button>
            </div>
          )}
          {order.status === "Delivered" && (
            <div className="flex items-center gap-3 px-3 pb-3">
              <button
                onClick={() => onReview(item)}
                className="flex-1 py-1.5 rounded border border-gray-300 bg-white text-xs font-medium text-gray-700 hover:bg-gray-50 transition cursor-pointer"
              >
                Write Review
              </button>
              <button className="flex-1 py-1.5 rounded border border-gray-300 bg-white text-xs font-medium text-gray-700 hover:bg-gray-50 transition cursor-pointer">
                Return
              </button>
              <Link
                href="/shop"
                className="flex-1 py-1.5 rounded border border-gray-300 bg-white text-xs font-medium text-gray-700 hover:bg-gray-50 transition text-center"
              >
                Buy Again
              </Link>
            </div>
          )}
        </div>
            </>
          );
        })()}

      </div>
    ))}
  </div>
);

// ─── Skeleton loader ──────────────────────────────────────────────────────────

const OrderSkeleton = () => (
  <div className="border border-gray-200 rounded-xl bg-white mb-4 overflow-hidden animate-pulse">
    <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex justify-between">
      <div className="h-3 w-40 bg-gray-200 rounded" />
      <div className="h-3 w-20 bg-gray-200 rounded" />
    </div>
    <div className="px-4 py-4 flex gap-4">
      <div className="w-[72px] h-[88px] bg-gray-150 rounded-lg shrink-0" style={{ background: "#f3f4f6" }} />
      <div className="flex-1 space-y-2 pt-1">
        <div className="h-3 w-3/4 bg-gray-200 rounded" />
        <div className="h-3 w-1/2 bg-gray-200 rounded" />
        <div className="h-3 w-1/4 bg-gray-200 rounded" />
      </div>
    </div>
  </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────

const OrdersPage = () => {
  // ── UI state ──────────────────────────────────────────────────────────────
  const [orders, setOrders] = useState<UIOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);

  // ── Filters (client-side: search / time; server-side: status) ────────────
  const [search, setSearch] = useState("");
  const [timeMonths, setTimeMonths] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // ── Modal state ───────────────────────────────────────────────────────────
  const [trackOrder, setTrackOrder] = useState<UIOrder | null>(null);
  const [cancelOrder, setCancelOrder] = useState<UIOrder | null>(null);
  const [reviewItem, setReviewItem] = useState<UIOrderItem | null>(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchOrders = useCallback(
    async (page: number, status: string) => {
      setLoading(true);
      setError(null);
      try {
        const res = await getMyOrders(page, PAGE_SIZE, status);
        if (res.success && res.data) {
          const { orders: raw, totalOrders: total, totalPages: pages } =
            res.data;
          setOrders((raw as RawOrder[]).map(normaliseOrder));
          setTotalOrders(total);
          setTotalPages(pages);
        } else {
          setError(res.message || "Failed to load orders.");
        }
      } catch {
        setError("Something went wrong. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // Re-fetch whenever page or status filter changes
  useEffect(() => {
    fetchOrders(currentPage, statusFilter);
  }, [currentPage, statusFilter, fetchOrders]);

  // Reset to page 1 when status filter changes
  const handleStatusChange = (val: string) => {
    setStatusFilter(val);
    setCurrentPage(1);
  };

  // ── Client-side filtering (search + time) ─────────────────────────────────
  const visibleOrders = orders.filter((order) => {
    // Time filter (applied on fetched data)
    if (timeMonths !== "all") {
      const cutoff = new Date();
      cutoff.setMonth(cutoff.getMonth() - Number(timeMonths));
      if (new Date(order.placedAt) < cutoff) return false;
    }
    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchId = order.orderId.toLowerCase().includes(q) || order.id.toLowerCase().includes(q);
      const matchItem = order.items.some((i) =>
        i.name.toLowerCase().includes(q),
      );
      if (!matchId && !matchItem) return false;
    }
    return true;
  });

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="ml-0 lg:ml-20 w-full lg:w-160">
        {/* Section header */}
        <div className="mb-5">
          <h4 className="text-xl font-semibold text-gray-900 font-[family-name:var(--font-montserrat)]">
            My Orders
          </h4>
          <p className="text-sm text-gray-500 mt-0.5">
            Track or buy things again
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="search in orders"
            className="w-full border border-gray-200 rounded-lg pl-4 pr-10 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#a97f0f] focus:border-[#a97f0f] bg-white"
          />
          <svg
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 mb-5 text-sm text-gray-600">
          <span>
            <strong className="text-gray-900">{totalOrders}</strong>{" "}
            {totalOrders === 1 ? "order" : "orders"} placed in
          </span>

          {/* Time filter (client-side) */}
          <div className="relative">
            <select
              value={timeMonths}
              onChange={(e) => setTimeMonths(e.target.value)}
              className="appearance-none bg-white border border-gray-200 rounded-lg pl-7 pr-14 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#a97f0f] cursor-pointer"
            >
              {TIME_FILTER_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <svg className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-500" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6" /></svg>
          </div>

          {/* Status filter (server-side) */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="appearance-none bg-white border border-gray-200 rounded-lg pl-7 pr-14 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#a97f0f] cursor-pointer"
            >
              {STATUS_FILTER_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <svg className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-500" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6" /></svg>
          </div>
        </div>

        {/* ── Content ─────────────────────────────────────────────────────── */}

        {/* Error state */}
        {error && !loading && (
          <div className="rounded-xl border border-red-100 bg-red-50 px-5 py-4 text-sm text-red-600 mb-4 flex items-center gap-3">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
            {error}
            <button
              onClick={() => fetchOrders(currentPage, statusFilter)}
              className="ml-auto text-xs font-semibold underline cursor-pointer hover:text-red-800"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading skeletons */}
        {loading && (
          <div>
            {[1, 2, 3].map((n) => (
              <OrderSkeleton key={n} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && visibleOrders.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.4" strokeLinecap="round" className="mb-4">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            <p className="text-gray-400 font-medium text-sm">
              {totalOrders === 0 ? "No orders yet" : "No orders match your filters"}
            </p>
            <p className="text-gray-400 text-xs mt-1">
              {totalOrders === 0
                ? "Your order history will appear here once you place an order"
                : "Try adjusting your search or filter"}
            </p>
            <Link
              href="/shop"
              className="mt-5 px-6 py-2.5 bg-gray-900 text-white text-sm rounded-lg hover:bg-black transition font-medium"
            >
              Start Shopping
            </Link>
          </div>
        )}

        {/* Order cards */}
        {!loading && !error && visibleOrders.length > 0 && (
          <div>
            {visibleOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onTrack={() => setTrackOrder(order)}
                onCancel={() => setCancelOrder(order)}
                onReview={(item) => setReviewItem(item)}
              />
            ))}
          </div>
        )}

        {/* ── Pagination ──────────────────────────────────────────────────── */}
        {!loading && totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-6">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
            >
              ← Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setCurrentPage(p)}
                className={`w-8 h-8 rounded-lg text-sm font-medium transition cursor-pointer ${p === currentPage
                  ? "bg-gray-900 text-white"
                  : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
            >
              Next →
            </button>
          </div>
        )}
      </div>

      {/* ── Modals ──────────────────────────────────────────────────────────── */}
      {trackOrder && (
        <TrackModal order={trackOrder} onClose={() => setTrackOrder(null)} />
      )}
      {cancelOrder && (
        <CancelModal order={cancelOrder} onClose={() => setCancelOrder(null)} />
      )}
      {reviewItem && (
        <ReviewModal item={reviewItem} onClose={() => setReviewItem(null)} />
      )}
    </>
  );
};

export default OrdersPage;
