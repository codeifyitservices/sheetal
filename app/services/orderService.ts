import { apiFetch } from "./api";

/**
 * Creates a COD (Cash on Delivery) order directly via the orders API.
 * For Online orders, use paymentService.createRazorpayPaymentLink instead.
 *
 * @param shippingAddress - The selected delivery address object
 * @param orderItems      - Array of cart items to order
 * @param pricing         - Price breakdown (itemsPrice, shippingPrice, taxPrice, totalPrice)
 */
export const createCODOrder = async (
  shippingAddress: object,
  billingAddress: object,
  orderItems: object[],
  email: string,
  pricing: {
    itemsPrice: number;
    shippingPrice: number;
    taxPrice: number;
    totalPrice: number;
  },
  buyNowItems?: object[],
  cartItems?: object[],
  couponData?: {
    couponId?: string;
    couponCode?: string;
    discountPrice?: number;
  },
  recoveryAttribution?: {
    recoverySource?: string;
    recoveryStage?: number;
    recoveryCartId?: string;
    recoveryCycleId?: string;
  },
) => {
  return apiFetch("/orders/create", {
    method: "POST",
    body: JSON.stringify({
      orderItems,
      shippingAddress,
      billingAddress,
      email,
      paymentInfo: {
        method: "COD",
        status: "Pending",
      },
      ...(buyNowItems ? { buyNowItems } : {}),
      ...(cartItems ? { cartItems } : {}),
      ...(couponData ? couponData : {}),
      ...(recoveryAttribution ? recoveryAttribution : {}),
      ...pricing,
    }),
  });
};

/**
 * Fetches paginated orders for the currently logged-in customer.
 * @param page   - 1-based page number (default 1)
 * @param limit  - Items per page (default 10)
 * @param status - Optional order status filter (Processing | Shipped | Delivered | Cancelled | Returned)
 * @returns API response: { success, data: { orders, totalOrders, currentPage, totalPages, hasNextPage, hasPrevPage }, message }
 */
export const getMyOrders = async (
  page: number = 1,
  limit: number = 50,
  status?: string,
) => {
  let url = `/orders/my-orders?page=${page}&limit=${limit}`;
  if (status && status !== "all") url += `&status=${status}`;
  return apiFetch(url, { method: "GET" });
};

/**
 * Fetches a single order by its MongoDB _id.
 * The backend verifies the order belongs to the authenticated user.
 * @param orderId - MongoDB ObjectId string of the order
 * @returns API response: { success, data: Order, message }
 */
export const getOrderById = async (orderId: string) => {
  return apiFetch(`/orders/${orderId}`, { method: "GET" });
};
