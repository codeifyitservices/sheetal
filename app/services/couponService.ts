import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL + "/api/v1/coupons";
const ABANDONED_CART_API_URL =
  process.env.NEXT_PUBLIC_API_URL + "/api/v1/abandoned-cart";

interface GetAllCouponsParams {
  page?: number;
  limit?: number;
  search?: string;
}

interface CouponResponse {
  success?: boolean;
  data?: unknown;
  message?: string;
}

export const getAllCouponsClient = async (
  token?: string,
  params?: GetAllCouponsParams,
) => {
  try {
    const headers = token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : undefined;
    const response = await axios.get(API_URL, { headers, params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const applyCouponClient = async (
  code: string,
  cartTotal: number,
  userId: string,
  cartItems: any[],
  token: string,
) => {
  try {
    const response = await axios.post(
      API_URL + "/apply",
      { code, cartTotal, userId, cartItems },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getHomepageCoupon = async (): Promise<CouponResponse> => {
  try {
    const response = await axios.get(`${API_URL}/homepage`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getLoginCoupon = async (): Promise<CouponResponse> => {
  try {
    const response = await axios.get(`${API_URL}/login`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getValidAbandonedCartCoupon = async (
  token?: string,
): Promise<CouponResponse> => {
  if (!token) {
    return { success: false, data: null };
  }
  try {
    const headers = {
      Authorization: `Bearer ${token}`,
    };
    const response = await axios.get(`${ABANDONED_CART_API_URL}/coupon`, {
      headers,
    });
    return response.data;
  } catch (error) {
    return { success: false, data: null };
  }
};
