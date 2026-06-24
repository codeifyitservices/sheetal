"use client";

import React from "react";

interface Address {
  id: string | number;
  name: string;
  addressLine1: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  email: string;
  phone: string;
  isDefault: boolean;
  addressType?: string;
}

interface AddressCardProps {
  address: Address;
  onEdit: (id: string | number) => void;
  onDelete: (id: string | number) => void;
  onSetDefault: (id: string | number) => void;
}

const AddressCard: React.FC<AddressCardProps> = ({
  address,
  onEdit,
  onDelete,
  onSetDefault,
}) => {
  return (
    <div className="w-full border border-gray-200 p-4 sm:p-6 rounded-sm hover:border-[#ac8037] transition-colors relative">
      {/* Top-right: address type badge + default checkmark */}
      <div className="absolute top-3 right-3 sm:top-4 sm:right-4 flex items-center gap-2">
        {address.addressType && (
          <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-sm bg-[#f5edd8] text-[#8b6b2f] border border-[#e0c97a]">
            {address.addressType}
          </span>
        )}
        {address.isDefault && (
          <svg
            clipRule="evenodd"
            height="20"
            width="20"
            fillRule="evenodd"
            imageRendering="optimizeQuality"
            shapeRendering="geometricPrecision"
            textRendering="geometricPrecision"
            viewBox="0 0 254000 254000"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="m37253 0h179494c20518 0 37253 16735 37253 37253v179494c0 20518-16735 37253-37253 37253h-179494c-20518 0-37253-16735-37253-37253v-179494c0-20518 16735-37253 37253-37253z"
              fill="none"
            />
            <path
              id="_228534648"
              d="m96229 162644 89510-89509c2637-2638 6967-2611 9578 0l8642 8642c2611 2611 2611 6968 0 9578l-89509 89510c-2611 2611-6941 2638-9579 0l-8642-8642c-2638-2638-2638-6941 0-9579z"
            />
            <path
              id="_228534744"
              d="m68270 108089 54525 54525c2637 2638 2606 6973 0 9579l-8642 8642c-2606 2605-6973 2605-9579 0l-54525-54525c-2606-2606-2637-6941 0-9579l8642-8642c2638-2637 6941-2637 9579 0z"
            />
          </svg>
        )}
      </div>

      {/* Pad right so content doesn't slide under the badge */}
      <div className="pr-24 sm:pr-28">
        <div className="font-bold text-gray-900 mt-1 text-base capitalize">
          {address.name}
        </div>

        <div className="text-sm text-black mt-2 mb-4 leading-relaxed break-words">
          {address.addressLine1}
          <br />
          {address.city}, {address.state}, {address.country} {address.pincode}
          <br />
          <span className="break-all">{address.email}</span>, {address.phone}
        </div>

        {!address.isDefault && (
          <button
            onClick={() => onSetDefault(address.id)}
            className="text-[#48b02c] text-sm mb-4 hover:underline text-left block cursor-pointer"
          >
            Make This Default
          </button>
        )}

        <div className="flex text-sm text-black mt-4 gap-3">
          <button
            onClick={() => onEdit(address.id)}
            className="flex-1 hover:text-[#a97f0f] transition-colors border rounded-[2px] px-2 py-1.5 cursor-pointer"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(address.id)}
            className="flex-1 hover:text-red-600 transition-colors border rounded-[2px] px-2 py-1.5 cursor-pointer"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddressCard;