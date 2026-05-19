"use client";

export const CART_UPDATED_EVENT = "shop:cart-updated";
export const WISHLIST_UPDATED_EVENT = "shop:wishlist-updated";
export const ORDER_CONFIRMED_EVENT = "shop:order-confirmed";
export const CART_ITEM_ADDED_EVENT = "shop:cart-item-added";

export interface CartItemAddedDetail {
  productName?: string;
}

const dispatchShopEvent = (eventName: string, detail?: unknown) => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(eventName, { detail }));
};

export const dispatchCartUpdated = () => {
  dispatchShopEvent(CART_UPDATED_EVENT);
};

export const dispatchWishlistUpdated = () => {
  dispatchShopEvent(WISHLIST_UPDATED_EVENT);
};

export const dispatchOrderConfirmed = () => {
  dispatchShopEvent(ORDER_CONFIRMED_EVENT);
};

export const dispatchCartItemAdded = (detail?: CartItemAddedDetail) => {
  dispatchShopEvent(CART_ITEM_ADDED_EVENT, detail);
};
