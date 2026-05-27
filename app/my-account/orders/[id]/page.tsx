"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { getOrderById } from "../../../services/orderService";
import { getApiImageUrl } from "../../../services/api";

// ─── Types ────────────────────────────────────────────────────────────────────

type OrderStatus =
    | "Processing"
    | "Shipped"
    | "Delivered"
    | "Cancelled"
    | "Returned"
    | "Exchanged"
    | "Return Requested";

interface OrderItem {
    _id: string;
    product: string | null;
    name: string;
    image: string;
    price: number;
    quantity: number;
    variant?: { size?: string; color?: string; v_sku?: string };
}

interface RawOrder {
    _id: string;
    orderItems: OrderItem[];
    orderStatus: OrderStatus;
    totalPrice: number;
    itemsPrice: number;
    shippingPrice: number;
    taxPrice: number;
    paymentInfo: { id?: string; status?: string; method: "COD" | "Online" };
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

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_STEPS: Record<OrderStatus, number> = {
    Processing: 0,
    Shipped: 1,
    Delivered: 2,
    Cancelled: -1,
    Returned: -1,
    Exchanged: -1,
    "Return Requested": -1,
};

const STATUS_LABEL: Record<OrderStatus, string> = {
    Processing: "Processing",
    Shipped: "Shipped",
    Delivered: "Delivered",
    Cancelled: "Cancelled",
    Returned: "Returned",
    Exchanged: "Exchanged",
    "Return Requested": "Return Requested",
};

// ─── Formatters ───────────────────────────────────────────────────────────────

const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });

const fmtDateTime = (iso: string) =>
    new Date(iso).toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
    });

// ─── Copy Button ──────────────────────────────────────────────────────────────

const CopyButton = ({ text }: { text: string }) => {
    const [copied, setCopied] = useState(false);
    const onClick = () => {
        navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };
    return (
        <button
            onClick={onClick}
            className="ml-2 text-gray-400 hover:text-[#a97f0f] transition-colors cursor-pointer inline-flex items-center"
            aria-label="Copy order ID"
        >
            {copied ? (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#a97f0f" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M20 6 9 17l-5-5" />
                </svg>
            ) : (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
            )}
        </button>
    );
};

// ─── Order Progress (horizontal 3-step, HTML style) ───────────────────────────

const OrderProgress = ({
    status,
    placedAt,
    deliveredAt,
}: {
    status: OrderStatus;
    placedAt: string;
    deliveredAt?: string;
}) => {
    const step = STATUS_STEPS[status] ?? 0;

    const steps = [
        {
            label: "Order Confirmed",
            sub: fmtDate(placedAt),
            done: step >= 0,
            align: "text-left",
        },
        {
            label: "Shipped",
            sub: step >= 1 ? "Dispatched" : "Pending",
            done: step >= 1,
            align: "text-center",
        },
        {
            label: "Delivery",
            sub:
                status === "Delivered" && deliveredAt
                    ? fmtDateTime(deliveredAt)
                    : "Expected soon",
            done: step >= 2,
            align: "text-right",
        },
    ];

    return (
        <div className="w-full mt-4 mb-2">
            {/* Connector + dots row */}
            <div className="relative flex items-center">
                {/* Background full line */}
                <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[2px] bg-gray-200" />
                {/* Progress fill */}
                <div
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-[2px] bg-[#a97f0f] transition-all"
                    style={{ width: step === 0 ? "0%" : step === 1 ? "50%" : "100%" }}
                />
                {steps.map((s, i) => (
                    <div
                        key={i}
                        className={`relative z-10 flex flex-col items-center ${i === 0 ? "mr-auto" : i === 1 ? "mx-auto" : "ml-auto"}`}
                    >
                        <div
                            className={`w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center transition-colors ${s.done ? "border-[#a97f0f] bg-[#a97f0f]" : "border-gray-300"
                                }`}
                        >
                            {s.done && (
                                <svg width="9" height="9" viewBox="0 0 10 8" fill="none">
                                    <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Labels row */}
            <div className="flex items-start mt-2">
                {steps.map((s, i) => (
                    <div
                        key={i}
                        className={`flex-1 ${s.align}`}
                    >
                        <p className={`text-[11px] font-semibold leading-tight ${s.done ? "text-gray-800" : "text-gray-400"}`}>
                            {s.label}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{s.sub}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

// ─── Tracking Timeline (vertical, "See all updates" expandable) ───────────────

const TrackingTimeline = ({ order }: { order: RawOrder }) => {
    const step = STATUS_STEPS[order.orderStatus] ?? 0;

    const timeline = [
        {
            label: "Order Placed",
            detail: "We have received your order.",
            date: fmtDateTime(order.createdAt),
            done: true,
        },
        {
            label: "Packed & Ready",
            detail: "Your order has been packed.",
            date: step >= 1 ? fmtDate(order.updatedAt) : "",
            done: step >= 1,
        },
        {
            label: "Shipped",
            detail: order.courierPartner
                ? `Shipped via ${order.courierPartner}`
                : "Your order is on the way.",
            date: "",
            done: step >= 1,
        },
        {
            label: "Out for Delivery",
            detail: "Delivery Executive details will be available once out for delivery.",
            date: "",
            done: step >= 2,
        },
        {
            label: "Delivered",
            detail: "Your order has been delivered.",
            date:
                order.orderStatus === "Delivered" && order.deliveredAt
                    ? fmtDateTime(order.deliveredAt)
                    : "",
            done: order.orderStatus === "Delivered",
        },
    ];

    return (
        <div className="mt-4 space-y-3 pl-1">
            {timeline.map((t, i) => (
                <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                        <div
                            className={`w-3.5 h-3.5 rounded-full border-2 shrink-0 flex items-center justify-center ${t.done ? "border-[#a97f0f] bg-[#a97f0f]" : "border-gray-300"
                                }`}
                        >
                            {t.done && (
                                <svg width="7" height="7" viewBox="0 0 10 8" fill="none">
                                    <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            )}
                        </div>
                        {i < timeline.length - 1 && (
                            <div
                                className={`w-px flex-1 mt-1 ${t.done ? "bg-[#a97f0f]" : "bg-gray-200"}`}
                                style={{ minHeight: 20 }}
                            />
                        )}
                    </div>
                    <div className="pb-2">
                        <p className={`text-sm font-semibold ${t.done ? "text-gray-900" : "text-gray-400"}`}>
                            {t.label}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">{t.detail}</p>
                        {t.date && <p className="text-xs text-gray-500 font-medium mt-0.5">{t.date}</p>}
                    </div>
                </div>
            ))}
        </div>
    );
};

// ─── Section heading (matches HTML .head style) ───────────────────────────────

const SectionHead = ({ children }: { children: React.ReactNode }) => (
    <div className="mb-3 pb-2 border-b border-gray-200">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">{children}</h3>
    </div>
);

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const Skeleton = () => (
    <div className="ml-0 lg:ml-20 w-full lg:w-160 animate-pulse space-y-5">
        <div className="h-4 w-48 bg-gray-200 rounded" />
        <div className="flex gap-4">
            <div className="w-24 h-28 bg-gray-100 rounded shrink-0" />
            <div className="flex-1 space-y-2 pt-1">
                <div className="h-3 w-3/4 bg-gray-200 rounded" />
                <div className="h-3 w-1/2 bg-gray-200 rounded" />
                <div className="h-3 w-1/4 bg-gray-200 rounded" />
            </div>
        </div>
        <div className="space-y-2">
            {[1, 2, 3, 4].map((n) => (
                <div key={n} className="flex justify-between">
                    <div className="h-3 w-32 bg-gray-200 rounded" />
                    <div className="h-3 w-20 bg-gray-200 rounded" />
                </div>
            ))}
        </div>
    </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────

const OrderDetailPage = () => {
    const params = useParams();
    const router = useRouter();
    const orderId = params?.id as string;

    const [order, setOrder] = useState<RawOrder | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showTracking, setShowTracking] = useState(false);

    useEffect(() => {
        if (!orderId) return;
        const fetch = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await getOrderById(orderId);
                if (res.success && res.data) {
                    setOrder(res.data as RawOrder);
                } else {
                    setError(res.message || "Order not found.");
                }
            } catch {
                setError("Something went wrong. Please try again.");
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, [orderId]);

    if (loading) return <Skeleton />;

    if (error) {
        return (
            <div className="ml-0 lg:ml-20 w-full lg:w-160">
                <div className="rounded border border-red-100 bg-red-50 px-5 py-6 text-center">
                    <p className="text-red-600 font-medium text-sm">{error}</p>
                    <button
                        onClick={() => router.back()}
                        className="mt-4 text-xs text-gray-500 underline hover:text-gray-700 cursor-pointer"
                    >
                        ← Go back
                    </button>
                </div>
            </div>
        );
    }

    if (!order) return null;

    const normalizedStatus = normalizeOrderStatus(order.orderStatus);

    const isCancelled =
        normalizedStatus === "Cancelled" ||
        normalizedStatus === "Returned" ||
        normalizedStatus === "Exchanged" ||
        normalizedStatus === "Return Requested";

    return (
        <div className="ml-0 lg:ml-20 w-full lg:w-160 font-[family-name:var(--font-montserrat)]">

            {/* ── Help button (top right) ── */}
            <div className="flex justify-end mb-3">
                <a
                    href="https://api.whatsapp.com/send?phone=919958813913"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs font-semibold text-[#683e14] border border-[#c8a96e] rounded px-3 py-1.5 hover:bg-[#f9f3ea] transition-colors"
                >
                    Help&nbsp;
                    <svg width="16" height="16" viewBox="0 0 512 512" fill="#683e14" xmlns="http://www.w3.org/2000/svg">
                        <path d="m307.66 465.229c0-17.696-14.346-32.042-32.042-32.042h-39.236c-8.498 0-16.648 3.376-22.657 9.385s-9.385 14.159-9.385 22.657c0 17.696 14.346 32.042 32.042 32.042h39.236c17.696 0 32.042-14.346 32.042-32.042zm-240.299-82.623c5.352.409 11.827.644 18.331.263 3.465 17.572 12.073 33.87 24.922 46.72 17.058 17.057 40.193 26.64 64.316 26.64h12.226c-.539 2.95-.816 5.961-.816 9 0 3.073.277 6.082.808 9h-12.218c-28.897 0-56.611-11.479-77.044-31.912-16.301-16.302-26.904-37.237-30.525-59.711zm-9.156-19.153c-14.211-2.396-27.435-9.152-37.758-19.476-13.092-13.092-20.447-30.849-20.447-49.364v-42.543c0-18.515 7.355-36.272 20.447-49.364s30.849-20.448 49.364-20.448h4.647c7.428-93.756 85.87-167.529 181.542-167.529s174.114 73.773 181.542 167.529h4.647c18.515 0 36.272 7.356 49.364 20.448s20.447 30.849 20.447 49.364v42.543c0 18.515-7.355 36.272-20.447 49.364-13.092 13.093-30.849 20.448-49.364 20.448h-20.601c-8.544 0-15.47-6.927-15.47-15.47v-152.108c0-82.908-67.21-150.118-150.118-150.118s-150.118 67.21-150.118 150.118v152.108c0 6.032-3.453 11.259-8.491 13.81-13.868 4.812-35.375 1.331-39.186.688z" />
                    </svg>
                </a>
            </div>

            {/* ── Order ID (top) ── */}
            <div className="flex items-center gap-2 mb-4">
                <button
                    onClick={() => router.back()}
                    className="text-gray-400 hover:text-gray-700 transition-colors cursor-pointer mr-1"
                    aria-label="Back"
                >
                    <svg width="18" height="18" viewBox="0 0 64 64" fill="currentColor">
                        <path d="m21.3 34.4c5.5 5.5 11 11 16.5 16.5.8.8 1.6 1.6 2.4 2.4 1.8 1.8-1 4.7-2.8 2.8-5.5-5.5-11-11-16.5-16.5-.3-.3-.6-.6-.9-.9 5-5 10-10 15-15 .8-.8 1.5-1.5 2.3-2.3 1.8-1.8-1-4.7-2.8-2.8l-16.4 16.4-2.3 2.3c-.9.6-.9 1.9-.1 2.7z" />
                    </svg>
                </button>
                <p className="text-sm text-gray-700">
                    <strong className="text-gray-900">Order ID #</strong>{" "}
                    <span className="font-mono">{order._id}</span>
                </p>
                <CopyButton text={order._id} />
                <span className="ml-auto text-xs text-gray-400">{fmtDate(order.createdAt)}</span>
            </div>

            {/* ── Per-item sections ── */}
            {order.orderItems.map((item) => (
                <div key={item._id} className="mb-6">

                    {/* Product summary */}
                    <div className="flex gap-4 mb-4">
                        {/* Image */}
                        <div
                            className="relative shrink-0 overflow-hidden bg-[#fce4ec]"
                            style={{ width: 90, height: 110 }}
                        >
                            <Image
                                src={getApiImageUrl(item.image)}
                                alt={item.name}
                                fill
                                className="object-cover"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src =
                                        "/assets/images/product-placeholder.webp";
                                }}
                            />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0 pt-1">
                            <p className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2 mb-1">
                                {item.name}
                            </p>
                            <p className="text-xs text-gray-600">
                                <strong className="text-gray-800">Color:</strong>{" "}
                                {item.variant?.color || "—"} |{" "}
                                <strong className="text-gray-800">Size:</strong>{" "}
                                {item.variant?.size || "—"}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                                Qty: {item.quantity} &nbsp;·&nbsp; ₹{item.price.toLocaleString("en-IN")}
                            </p>
                        </div>
                    </div>

                    {/* Order status section */}
                    <div className="border border-gray-200 rounded p-4 mb-4">
                        {/* Status heading row */}
                        <div className="flex items-start justify-between mb-1">
                            <div>
                                <p className="text-sm font-bold text-gray-900">
                                    {STATUS_LABEL[normalizedStatus]}
                                </p>
                                {!isCancelled && (
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        {normalizedStatus === "Delivered"
                                            ? "Your order has been delivered."
                                            : `Your order is ${STATUS_LABEL[normalizedStatus].toLowerCase()}.`}
                                    </p>
                                )}
                                {isCancelled && (
                                    <p className="text-xs text-red-500 mt-0.5">
                                        Order {STATUS_LABEL[normalizedStatus]}.
                                    </p>
                                )}
                            </div>
                            {!isCancelled && normalizedStatus !== "Processing" && (
                                <span className="text-[11px] font-semibold px-2 py-0.5 bg-green-50 text-green-700 rounded-full shrink-0 ml-2">
                                    On Time
                                </span>
                            )}
                            {isCancelled && (
                                <span className="text-[11px] font-semibold px-2 py-0.5 bg-red-50 text-red-600 rounded-full shrink-0 ml-2">
                                    {STATUS_LABEL[normalizedStatus]}
                                </span>
                            )}
                        </div>

                        {/* Progress track */}
                        {!isCancelled && (
                            <OrderProgress
                                status={normalizedStatus}
                                placedAt={order.createdAt}
                                deliveredAt={order.deliveredAt}
                            />
                        )}

                        {/* Tracking number */}
                        {(order.trackingId || order.awbCode) && (
                            <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                    <circle cx="12" cy="12" r="10" />
                                    <polyline points="12 6 12 12 16 14" />
                                </svg>
                                Tracking:{" "}
                                <span className="font-semibold text-gray-800 font-mono">
                                    {order.awbCode || order.trackingId}
                                </span>
                                {order.courierPartner && (
                                    <span className="text-gray-400">via {order.courierPartner}</span>
                                )}
                            </div>
                        )}

                        {/* Info note */}
                        {!isCancelled && (
                            <div className="mt-3 flex items-start gap-2 text-xs text-gray-500 bg-gray-50 rounded px-3 py-2 border border-gray-100">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="shrink-0 mt-0.5">
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="12" y1="8" x2="12" y2="12" />
                                    <line x1="12" y1="16" x2="12.01" y2="16" />
                                </svg>
                                Delivery Executive details will be available once the order is out for delivery.
                            </div>
                        )}

                        {/* See all updates */}
                        {!isCancelled && (
                            <div className="mt-3 text-center">
                                <button
                                    onClick={() => setShowTracking((v) => !v)}
                                    className="text-xs font-semibold text-[#a97f0f] hover:text-[#8b6b2f] transition-colors cursor-pointer underline underline-offset-2"
                                >
                                    {showTracking ? "Hide updates" : "See all updates"}
                                </button>
                            </div>
                        )}

                        {/* Expanded tracking timeline */}
                        {showTracking && !isCancelled && <TrackingTimeline order={order} />}
                    </div>

                    {/* Chat with us */}
                    <div className="mb-4 flex items-center gap-2 text-xs text-gray-500">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="shrink-0">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                        Delivery Executive details will be available once the order is out for delivery.
                        <a
                            href="https://api.whatsapp.com/send?phone=919958813913"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-2 text-green-600 font-semibold flex items-center gap-1 hover:text-green-700"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
                            </svg>
                            Chat with us
                        </a>
                    </div>
                </div>
            ))}

            {/* ── Delivery Details card ── */}
            <div className="border border-gray-200 rounded-xl mb-4 overflow-hidden">
                <div className="px-4 pt-4 pb-3">
                    <p className="text-sm font-bold text-gray-900 mb-3">Delivery Details</p>

                    {/* Person row */}
                    <div className="flex items-center gap-3 bg-gray-100 rounded-lg px-3 py-2.5 mb-2">
                        <Image
                            src="/assets/icons/person-1.svg"
                            alt="Person"
                            width={18}
                            height={18}
                        />
                        <span className="text-sm font-semibold text-gray-900">
                            {order.shippingAddress.fullName}
                        </span>
                        <span className="text-sm text-gray-500 ml-2">
                            {order.shippingAddress.phoneNumber}
                        </span>
                    </div>

                    {/* Home / address row */}
                    <div className="flex items-center gap-3 bg-gray-100 rounded-lg px-3 py-2.5">
                        <Image
                            src="/assets/icons/home-button.svg"
                            alt="Home"
                            width={18}
                            height={18}
                        />
                        <span className="text-sm font-semibold text-gray-900 shrink-0">Home</span>
                        <span className="text-sm text-gray-500 truncate">
                            {order.shippingAddress.addressLine1}, {order.shippingAddress.city},{" "}
                            {order.shippingAddress.state} — {order.shippingAddress.postalCode}
                        </span>
                    </div>
                </div>
            </div>

            {/* ── Price Details card ── */}
            <div className="border border-gray-200 rounded-xl mb-4 overflow-hidden">
                <div className="px-4 pt-4 pb-3">
                    <p className="text-sm font-bold text-gray-900 mb-3">Price Details</p>

                    {/* Price rows with thin dividers */}
                    <div className="divide-y divide-gray-100">
                        <div className="flex justify-between items-center py-2.5 text-sm text-gray-600">
                            <span>Listing Price</span>
                            <span>₹{order.itemsPrice.toLocaleString("en-IN")}</span>
                        </div>
                        {order.shippingPrice > 0 && (
                            <div className="flex justify-between items-center py-2.5 text-sm text-gray-600">
                                <span>Shipping Charges</span>
                                <span>₹{order.shippingPrice.toLocaleString("en-IN")}</span>
                            </div>
                        )}
                        {order.shippingPrice === 0 && (
                            <div className="flex justify-between items-center py-2.5 text-sm text-gray-600">
                                <span>Shipping Charges</span>
                                <span className="text-green-600 font-medium">FREE</span>
                            </div>
                        )}
                        {order.taxPrice > 0 && (
                            <div className="flex justify-between items-center py-2.5 text-sm text-gray-600">
                                <span>Tax</span>
                                <span>₹{order.taxPrice.toLocaleString("en-IN")}</span>
                            </div>
                        )}

                        {/* Total Amount row */}
                        <div className="flex justify-between items-center py-3">
                            <span className="text-sm font-bold text-gray-900">Total Amount</span>
                            <span className="text-base font-bold text-gray-900">
                                ₹{order.totalPrice.toLocaleString("en-IN")}
                            </span>
                        </div>
                    </div>

                    {/* Payment method — gray boxed row */}
                    <div className="flex justify-between items-center mt-1 border border-gray-200 rounded-lg px-3 py-2.5 bg-gray-50">
                        <span className="text-sm text-gray-600">Payment method</span>
                        <span className="text-sm font-semibold text-gray-800">
                            {order.paymentInfo.method}
                            {order.paymentInfo.status === "Paid" && (
                                <span className="ml-1.5 text-green-600">· Paid</span>
                            )}
                            {order.paymentInfo.status === "Pending" &&
                                order.paymentInfo.method === "COD" && (
                                    <span className="ml-1.5 text-amber-600">· Pay on delivery</span>
                                )}
                        </span>
                    </div>
                </div>
            </div>


            {/* ── Order ID bottom ── */}
            <div className="flex items-center py-4 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                    <strong className="text-gray-800">Order ID #</strong>{" "}
                    <span className="font-mono text-gray-600">{order._id}</span>
                    <CopyButton text={order._id} />
                </p>
            </div>

            {/* ── Shop more — full-width bordered button ── */}
            <Link
                href="/shop"
                className="w-full block text-center py-3 border border-[#a97f0f] text-[#a97f0f] text-sm font-semibold hover:bg-[#fdf6e8] transition-colors mt-1 mb-4"
            >
                Shop more from SBS →
            </Link>
        </div>
    );
};

export default OrderDetailPage;
