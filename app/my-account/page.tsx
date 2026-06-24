"use client";

import React from "react";
import DashboardLinkCard from "./components/DashboardLinkCard";

const ORDERS_ICON_PATH = "/assets/icons/orders.svg";
const WISHLIST_ICON_PATH = "/assets/icons/wishlist.svg";
const SAVED_CARDS_ICON_PATH = "/assets/icons/cards.svg";
const ADDRESS_ICON_PATH = "/assets/icons/address.svg";

const MyAccountOverviewPage = () => {
  return (
    <div className="w-full px-4 lg:px-6">
      {/* Header */}
      <h4 className="text-xl font-semibold text-gray-900 mb-2">Dashboard</h4>
      <hr className="mb-8 border-gray-200" />

      {/* Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 gap-6 w-full max-w-2xl lg:max-w-4xl lg:grid-cols-3">
        <DashboardLinkCard
          href="/my-account/orders"
          icon={ORDERS_ICON_PATH}
          title="Orders"
          description="Check your order status"
        />
        <DashboardLinkCard
          href="/wishlist"
          icon={WISHLIST_ICON_PATH}
          title="Wishlist"
          description="All product collections"
        />
        <DashboardLinkCard
          href="/my-account/cards"
          icon={SAVED_CARDS_ICON_PATH}
          title="Saved Cards"
          description="Save your cards for faster checkout"
        />
        <DashboardLinkCard
          href="/my-account/addresses"
          icon={ADDRESS_ICON_PATH}
          title="Address"
          description="Save addresses for a hassle free checkout"
        />
      </div>
    </div>
  );
};

export default MyAccountOverviewPage;