import React from "react";
import DashboardLinkCard from "./DashboardLinkCard";
import EditProfile from "./EditProfile"; // Import the new EditProfile component

const ORDERS_ICON_PATH = "/assets/icons/orders.svg";
const WISHLIST_ICON_PATH = "/assets/icons/wishlist.svg";
const SAVED_CARDS_ICON_PATH = "/assets/icons/cards.svg";
const ADDRESS_ICON_PATH = "/assets/icons/address.svg";

interface DashboardContentProps {
  activeSection: string;
}

const DashboardContent: React.FC<DashboardContentProps> = ({
  activeSection,
}) => {
  const renderContent = () => {
    switch (activeSection) {
      case "overview":
        return (
          <div className="ml-20 w-160">
            {/* Header */}
            <h4 className="text-xl font-semibold text-gray-900 mb-2">
              Dashboard
            </h4>
            <hr className="mb-8 border-gray-200" />

            {/* Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl">
              <DashboardLinkCard
                href="/my-account/orders"
                icon={ORDERS_ICON_PATH}
                title="Orders"
                description="Check your order status"
              />
              <DashboardLinkCard
                href="/my-account/wishlist"
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
      case "profile": // This was 'profile.html' in the original, I'll map it to 'profile'
        return (
          <div className="ml-20 w-160">
            <h4 className="text-2xl font-semibold text-gray-800 mb-6">
              Profile Settings
            </h4>
            {/* Content for profile settings if any, otherwise just heading */}
          </div>
        );
      case "edit-profile": // New case for edit profile
        return <EditProfile />;
      case "orders":
        return (
          <h4 className="text-2xl font-semibold text-gray-800 mb-6">
            Orders & Returns
          </h4>
        );
      case "cards":
        return (
          <h4 className="text-2xl font-semibold text-gray-800 mb-6">
            Saved Cards
          </h4>
        );
      case "addresses":
        return (
          <h4 className="text-2xl font-semibold text-gray-800 mb-6">
            My Addresses
          </h4>
        );
      case "terms-conditions":
        return (
          <h4 className="text-2xl font-semibold text-gray-800 mb-6">
            Terms of Use
          </h4>
        );
      case "privacy-center":
        return (
          <h4 className="text-2xl font-semibold text-gray-800 mb-6">
            Privacy Center
          </h4>
        );
      default:
        return null;
    }
  };

  return (
    <div className="col-lg-8">
      <div className="">
        {" "}
        {/* Moved bg-white and shadow here */}
        {renderContent()}
      </div>
    </div>
  );
};

export default DashboardContent;
