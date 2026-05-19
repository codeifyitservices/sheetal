"use client";

import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  dispatchCartUpdated,
  dispatchOrderConfirmed,
} from "../../hooks/shopEvents";
import { verifyRazorpayPayment } from "../../services/paymentService";
import HideStorefrontHeader from "../../components/HideStorefrontHeader";

const INVOICE_ORDER_ID_KEY = "checkout_invoice_order_id";
const COUPON_STATE_KEY = "cart_coupon_state";

const resolveOrderId = (values: Array<string | null | undefined>) => {
  for (const value of values) {
    if (value) return value;
  }
  return "";
};

const resetPersistedCouponState = () => {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(COUPON_STATE_KEY);
};

const BrandSpinner = () => (
  <div className="relative flex h-18 w-18 items-center justify-center">
    <div className="absolute inset-0 rounded-full border border-[#d5c29a]/50" />
    <div className="absolute inset-2 rounded-full border-2 border-[#bd9951] border-t-transparent animate-spin" />
    <div className="h-6 w-6 rounded-full bg-[#bd9951]/15" />
  </div>
);

const StatusShell = ({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children?: React.ReactNode;
}) => (
  <div className="relative overflow-hidden rounded-[28px] border border-[#e7dcc8] bg-[#fffaf3] shadow-[0_30px_80px_rgba(63,44,13,0.08)]">
    <div className="relative px-6 py-8 sm:px-10 sm:py-10">
      <div className="mb-6 inline-flex items-center rounded-full border border-[#dcc597] bg-white/90 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8d6b2f]">
        {eyebrow}
      </div>
      <div className="mb-6 flex justify-center">{children}</div>
      <div className="text-center">
        <h1 className="font-[family-name:var(--font-optima)] text-[34px] leading-tight text-[#3f2c0d] sm:text-[42px]">
          {title}
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-[15px] leading-7 text-[#6e624f] sm:text-[16px]">
          {description}
        </p>
      </div>
    </div>
  </div>
);

const SuccessContent = () => {
  const searchParams = useSearchParams();
  const hasFinalizedRef = useRef(false);

  const paymentLinkId = searchParams.get("razorpay_payment_link_id");
  const referenceId = searchParams.get("razorpay_payment_link_reference_id");
  const paymentLinkStatus = searchParams.get("razorpay_payment_link_status");
  const paymentId = searchParams.get("razorpay_payment_id");
  const signature = searchParams.get("razorpay_signature");

  const paymentMethod = searchParams.get("payment_method");
  const isCOD = paymentMethod === "cod";
  const isOnline = Boolean(paymentId && signature);

  const initialOrderId = useMemo(
    () =>
      resolveOrderId([
        searchParams.get("order_id"),
        searchParams.get("orderId"),
        referenceId,
        paymentLinkId,
      ]),
    [paymentLinkId, referenceId, searchParams],
  );

  const [verifying, setVerifying] = useState(isOnline);
  const [verifyError, setVerifyError] = useState("");
  const [invoiceOrderId, setInvoiceOrderId] = useState(initialOrderId);

  useEffect(() => {
    const storedOrderId =
      typeof window !== "undefined"
        ? sessionStorage.getItem(INVOICE_ORDER_ID_KEY)
        : "";
    const nextOrderId = initialOrderId || storedOrderId;

    if (nextOrderId && typeof window !== "undefined") {
      setInvoiceOrderId(nextOrderId);
      sessionStorage.setItem(INVOICE_ORDER_ID_KEY, nextOrderId);
    }
  }, [initialOrderId]);

  useEffect(() => {
    if (!isOnline) {
      setVerifying(false);
      return;
    }

    const verify = async () => {
      try {
        const res = await verifyRazorpayPayment({
          razorpay_payment_link_id: paymentLinkId!,
          razorpay_payment_link_reference_id: referenceId!,
          razorpay_payment_link_status: paymentLinkStatus!,
          razorpay_payment_id: paymentId!,
          razorpay_signature: signature!,
        });

        if (!res?.success) {
          setVerifyError(res?.message || "We could not verify your payment.");
          return;
        }

        const verifiedOrderId = resolveOrderId([
          res?.data?.orderId,
          res?.data?._id,
          res?.data?.id,
          referenceId,
          paymentLinkId,
        ]);

        if (verifiedOrderId && typeof window !== "undefined") {
          setInvoiceOrderId(verifiedOrderId);
          sessionStorage.setItem(INVOICE_ORDER_ID_KEY, verifiedOrderId);
        }
      } catch (error: unknown) {
        setVerifyError(
          error instanceof Error
            ? error.message
            : "We could not verify your payment.",
        );
      } finally {
        setVerifying(false);
      }
    };

    void verify();
  }, [
    isOnline,
    paymentId,
    paymentLinkId,
    paymentLinkStatus,
    referenceId,
    signature,
  ]);

  useEffect(() => {
    if (verifying || verifyError || hasFinalizedRef.current) return;

    hasFinalizedRef.current = true;
    resetPersistedCouponState();
    dispatchOrderConfirmed();
    dispatchCartUpdated();
  }, [verifyError, verifying]);

  const invoiceHref = invoiceOrderId
    ? `/checkout/download-invoice?orderId=${encodeURIComponent(invoiceOrderId)}`
    : "/checkout/download-invoice";

  const eyebrow = verifying
    ? "Finalizing Order"
    : verifyError
      ? "Payment Check Pending"
      : isCOD
        ? "Order Confirmed"
        : "Payment Successful";

  return (
    <div className="min-h-screen bg-[#f7f2e8] font-montserrat text-[#2e261b]">
      <HideStorefrontHeader />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#efe0bc_0%,rgba(239,224,188,0.45)_24%,transparent_54%)]" />
      <div className="relative mx-auto flex min-h-screen max-w-6xl items-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid w-full gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="order-2 lg:order-1">
            {verifying ? (
              <StatusShell
                eyebrow={eyebrow}
                title="Confirming Your Payment"
                description="We are validating your payment with our payment partner and preparing your order confirmation."
              >
                <BrandSpinner />
              </StatusShell>
            ) : verifyError ? (
              <StatusShell
                eyebrow={eyebrow}
                title="We Need One More Check"
                description={verifyError}
              >
                <div className="flex h-18 w-18 items-center justify-center rounded-full border border-[#e7b7b0] bg-[#fff1ef]">
                  <svg
                    className="h-8 w-8 text-[#b24d3d]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.8}
                      d="M6 18 18 6M6 6l12 12"
                    />
                  </svg>
                </div>
              </StatusShell>
            ) : (
              <StatusShell
                eyebrow={eyebrow}
                title={isCOD ? "Order Confirmed" : "Payment Received"}
                description={
                  isCOD
                    ? "Your order is reserved and will be paid for on delivery. We will reach out as it moves to dispatch."
                    : "Thank you for shopping with Studio By Sheetal. Your order has been placed successfully and is now being processed."
                }
              >
                <div className="flex h-18 w-18 items-center justify-center rounded-full border border-[#cbb47b] bg-[#fff5dc]">
                  <svg
                    className="h-8 w-8 text-[#8d6b2f]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.8}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              </StatusShell>
            )}
          </div>

          <div className="order-1 flex flex-col justify-center lg:order-2">
            <div className="overflow-hidden rounded-[28px] border border-[#eadfce] bg-white/85 shadow-[0_24px_60px_rgba(63,44,13,0.08)] backdrop-blur-sm">
              <div className="border-b border-[#efe5d7] px-6 py-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#9a7a3d]">
                  Order Snapshot
                </p>
                <h2 className="mt-2 font-[family-name:var(--font-optima)] text-[30px] text-[#3f2c0d]">
                  {isCOD
                    ? "Your order is in place"
                    : "Your payment went through"}
                </h2>
              </div>

              <div className="space-y-5 px-6 py-6">
                {invoiceOrderId && (
                  <div className="rounded-2xl border border-[#eee2cf] bg-[#fcf8f1] px-4 py-3">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-[#9e8a67]">
                      Order Reference
                    </p>
                    <p className="mt-1 break-all text-[15px] font-semibold text-[#423522]">
                      {invoiceOrderId}
                    </p>
                  </div>
                )}

                {isCOD && !verifying && !verifyError && (
                  <div className="rounded-2xl border border-[#ecd8a3] bg-[#fff7df] px-4 py-3 text-[14px] leading-6 text-[#71561f]">
                    Cash will be collected when the order arrives at your
                    doorstep.
                  </div>
                )}

                <div className="grid gap-3">
                  {!verifying && !verifyError && (
                    <Link
                      href={invoiceHref}
                      target="_blank"
                      className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#bd9951] px-5 text-[13px] font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-[#a8843f]"
                    >
                      Download Invoice
                    </Link>
                  )}
                  <Link
                    href="/"
                    className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#2e261b] px-5 text-[13px] font-semibold uppercase tracking-[0.18em] text-[#2e261b] transition hover:bg-[#2e261b] hover:text-white"
                  >
                    Continue Shopping
                  </Link>
                  {verifyError && (
                    <Link
                      href="/checkout/address"
                      className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#bd9951] px-5 text-[13px] font-semibold uppercase tracking-[0.18em] text-[#8d6b2f] transition hover:bg-[#fff4de]"
                    >
                      Back To Checkout
                    </Link>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 hidden items-center gap-4 rounded-[24px] border border-[#eadfce] bg-white/70 px-5 py-4 shadow-[0_20px_50px_rgba(63,44,13,0.05)] backdrop-blur-sm sm:flex">
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-[20px] bg-[#f5eee1]">
                <Image
                  src="/assets/335014072.png"
                  alt="Studio By Sheetal"
                  fill
                  className="object-contain p-3"
                />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#9a7a3d]">
                  Studio By Sheetal
                </p>
                <p className="mt-1 text-[15px] leading-6 text-[#685b47]">
                  Elegant festive wear, crafted details, and a smoother
                  post-checkout experience.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SuccessPageFallback = () => (
  <div className="min-h-screen bg-[#f7f2e8] px-4 py-8 font-montserrat sm:px-6 lg:px-8">
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center">
      <div className="w-full rounded-[28px] border border-[#e7dcc8] bg-[#fffaf3] px-6 py-10 shadow-[0_30px_80px_rgba(63,44,13,0.08)] sm:px-10">
        <div className="mb-6 flex justify-center">
          <BrandSpinner />
        </div>
        <div className="text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#9a7a3d]">
            Finalizing Order
          </p>
          <h1 className="mt-3 font-[family-name:var(--font-optima)] text-[34px] text-[#3f2c0d] sm:text-[42px]">
            Preparing Your Confirmation
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-[15px] leading-7 text-[#6e624f] sm:text-[16px]">
            We are loading your confirmation details.
          </p>
        </div>
      </div>
    </div>
  </div>
);

const SuccessPage = () => {
  return (
    <Suspense fallback={<SuccessPageFallback />}>
      <SuccessContent />
    </Suspense>
  );
};

export default SuccessPage;
