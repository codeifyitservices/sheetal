"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import StarRating from "./StarRating";
import { checkCanReview, addReview, fetchProductReviews } from "../../services/productService";
import toast from "react-hot-toast";
import Cookies from "js-cookie";
import { redirectToLogin } from "../../utils/authRedirect";

export interface Review {
  _id: string;
  user:
  | {
    _id: string;
    name: string;
    profileImage?: string;
  }
  | string;
  userName: string;
  rating: number;
  comment: string;
  createdAt?: string;
}

interface ProductReviewsProps {
  productId: string;
  initialReviews: Review[];
  overallRating: number;
  totalReviews: number;
  limit?: number;
  viewAllHref?: string;
  showFilters?: boolean;
  compactHeader?: boolean;
  stackedList?: boolean;
}

const ProductReviews: React.FC<ProductReviewsProps> = ({
  productId,
  initialReviews,
  overallRating,
  totalReviews: initialTotal,
  limit,
  viewAllHref,
  showFilters = false,
  compactHeader = false,
  stackedList = false,
}) => {
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [totalReviews, setTotalReviews] = useState(initialTotal);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [canReview, setCanReview] = useState(false);
  const [reviewReason, setReviewReason] = useState<string | null>(null);
  const [loadingCanReview, setLoadingCanReview] = useState(true);
  const [reviewFilter, setReviewFilter] = useState<"all" | "good" | "bad">("all");
  const router = useRouter();

  const sortedReviews = useMemo(() => {
    return [...reviews].sort((a, b) => {
      if (b.rating !== a.rating) {
        return b.rating - a.rating;
      }

      const firstDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const secondDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return secondDate - firstDate;
    });
  }, [reviews]);

  const visibleReviews = useMemo(() => {
    const filteredReviews = sortedReviews.filter((review) => {
      if (reviewFilter === "good") {
        return review.rating >= 3;
      }

      if (reviewFilter === "bad") {
        return review.rating <= 2;
      }

      return true;
    });

    return typeof limit === "number"
      ? filteredReviews.slice(0, limit)
      : filteredReviews;
  }, [limit, reviewFilter, sortedReviews]);

  // Check eligibility on mount if logged in
  useEffect(() => {
    const token = Cookies.get("token");
    if (!token) {
      setLoadingCanReview(false);
      return;
    }

    const checkEligibility = async () => {
      try {
        const res = await checkCanReview(productId);
        if (res.success) {
          setCanReview(res.data.canReview);
          setReviewReason(res.data.reason);
        }
      } catch (err) {
        console.error("Eligibility check failed", err);
      } finally {
        setLoadingCanReview(false);
      }
    };

    checkEligibility();
  }, [productId]);

  // Sync initial reviews if they change (e.g. parent fetch)
  useEffect(() => {
    setReviews(initialReviews);
    setTotalReviews(initialTotal);
  }, [initialReviews, initialTotal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error("Please select a star rating");
      return;
    }
    if (!comment.trim()) {
      toast.error("Please write a comment");
      return;
    }

    setSubmitting(true);
    try {
      const res = await addReview(productId, rating, comment);
      if (res.success) {
        toast.success("Review submitted! It will appear after admin approval.");
        setShowForm(false);
        setRating(0);
        setComment("");
        setCanReview(false); // Can't review twice

        // Refresh reviews list
        const refreshed = await fetchProductReviews(productId);
        if (refreshed.success) {
          setReviews(refreshed.data);
          setTotalReviews(refreshed.data.length);
        }
      } else {
        toast.error(res.message || "Failed to submit review");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="max-w-6xl mx-auto px-4 py-5">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h3
          className={`text-[26px] text-[#a2690f] font-[family-name:var(--font-optima)] ${
            compactHeader ? "text-left" : "text-center md:text-left"
          }`}
        >
          Customer Reviews
        </h3>
        {viewAllHref ? (
          <Link
            href={viewAllHref}
            className="text-sm font-semibold uppercase tracking-[0.2em] text-[#a2690f] hover:text-[#7d4e07] transition-colors"
          >
            View All Reviews
          </Link>
        ) : null}
      </div>
      <div className="border-t border-gray-300 mb-10" />

      {/* Summary Row */}
      <div
        className={`flex flex-col gap-6 mb-12 ${
          compactHeader
            ? "md:flex-row md:items-start md:justify-between"
            : "md:flex-row md:items-center md:justify-center md:space-x-32"
        }`}
      >
        {/* Rating Summary */}
        <div
          className={`flex flex-col ${
            compactHeader ? "items-start" : "items-center"
          } md:border-r border-gray-300 ${compactHeader ? "md:pr-10" : "md:px-20"}`}
        >
          <StarRating rating={Math.round(overallRating)} />
          <p className="text-lg mt-2">Based on {totalReviews} Reviews</p>
        </div>

        {/* Write Review Area */}
        <div className={`overflow-hidden ${compactHeader ? "md:flex-1" : "md:w-auto"}`}>
          {!showForm ? (
            <div className={compactHeader ? "text-left" : "text-center"}>
              {loadingCanReview ? (
                <div className="h-12 w-40 bg-gray-100 animate-pulse" />
              ) : canReview ? (
                <button
                  onClick={() => setShowForm(true)}
                  className="bg-black text-white px-10 py-3 text-sm tracking-widest hover:bg-gray-900 transition cursor-pointer"
                >
                  WRITE A REVIEW
                </button>
                ) : (
                  <div className="text-sm text-gray-500 italic max-w-xs">
                    {!Cookies.get("token") ? (
                      <button
                        type="button"
                        onClick={() => redirectToLogin(router)}
                        className="cursor-pointer underline"
                      >
                        Please log in to write a review.
                      </button>
                    ) : reviewReason === "Already reviewed" ? (
                      <p>You have already reviewed this product.</p>
                    ) : (
                    <p>Only customers who have received this product (Delivered) can write a review.</p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="transition-all duration-500 ease-out max-h-[600px] opacity-100">
              {/* Review Form */}
              <form
                onSubmit={handleSubmit}
                className="border border-gray-200 p-6 relative flex flex-col items-center bg-white shadow-sm rounded-lg w-full md:w-96"
              >
                <div className="mb-4 flex justify-between items-center border-b pb-4 w-full">
                  <h4 className="text-lg font-medium">Write a review</h4>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="text-2xl text-gray-400 hover:text-black transition-colors"
                  >
                    ×
                  </button>
                </div>

                <div className="mb-6 flex flex-col items-center gap-2 w-full">
                  <p className="text-sm text-gray-600 font-medium">Your Rating</p>
                  <StarRating rating={rating} onRatingChange={setRating} />
                </div>

                <textarea
                  placeholder="Share your thoughts about the product..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 mb-6 focus:ring-1 focus:ring-black focus:border-black outline-none resize-none transition-all text-sm"
                  rows={4}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  required
                />

                <button
                  type="submit"
                  disabled={submitting}
                  className={`w-full border border-black px-10 py-2.5 text-sm font-semibold transition-all ${submitting
                    ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                    : "hover:bg-black hover:text-white cursor-pointer"
                    }`}
                >
                  {submitting ? "Submitting..." : "Submit Review"}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-gray-300 mb-12" />

      {showFilters ? (
        <div className="mb-8 flex flex-wrap gap-3">
          {[
            { key: "all", label: "All" },
            { key: "good", label: "Good Reviews" },
            { key: "bad", label: "Bad Reviews" },
          ].map((filter) => (
            <button
              key={filter.key}
              type="button"
              onClick={() =>
                setReviewFilter(filter.key as "all" | "good" | "bad")
              }
              className={`rounded-full border px-5 py-2 text-sm font-medium transition-colors cursor-pointer ${
                reviewFilter === filter.key
                  ? "border-[#a2690f] bg-[#a2690f] text-white"
                  : "border-gray-300 text-gray-700 hover:border-[#a2690f] hover:text-[#a2690f]"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      ) : null}

      {/* Reviews Grid */}
      <div className={stackedList ? "space-y-8" : "grid grid-cols-1 md:grid-cols-2 gap-12"}>
        {visibleReviews.length > 0 ? (
          visibleReviews.map((review) => {
            const userName = review.userName || (typeof review.user === "object" ? review.user.name : "Customer");
            const userInitial = userName.charAt(0);

            return (
              <div key={review._id} className="pb-8 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-gray-50 border border-gray-200 rounded-full flex items-center justify-center text-sm font-bold text-gray-600 uppercase">
                    {userInitial}
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-gray-900">{userName}</span>
                    {review.createdAt && (
                      <p className="text-[10px] text-gray-400 uppercase tracking-tighter">
                        {new Date(review.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    )}
                  </div>
                </div>

                <StarRating rating={review.rating} />

                <p className="text-sm text-gray-700 mt-3 leading-relaxed">
                  {review.comment}
                </p>
              </div>
            );
          })
        ) : (
          <p className={`text-gray-500 text-center py-10 ${stackedList ? "" : "col-span-2"}`}>
            {reviews.length > 0
              ? "No reviews match the selected filter."
              : "No reviews yet. Be the first to review this product!"}
          </p>
        )}
      </div>
    </section>
  );
};

export default ProductReviews;
