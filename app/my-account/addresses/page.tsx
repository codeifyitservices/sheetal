"use client";

import React, { useState, useEffect } from "react";
import AddressCard from "../components/AddressCard";
import AddAddressModal from "../components/AddAddressModal";
import {
  getCurrentUser,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from "../../services/userService";

const AddressesPage = () => {
  const [addresses, setAddresses] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingAddress, setEditingAddress] = useState<any>(null);
  const [userEmail, setUserEmail] = useState("");

  const mapAddresses = (data: any[], email: string) =>
    data.map((addr: any) => ({
      ...addr,
      id: addr._id,
      pincode: addr.postalCode,
      name: `${addr.firstName} ${addr.lastName}`,
      address: addr.addressLine1,
      phone: addr.phoneNumber,
      email,
    }));

  const fetchAddresses = async () => {
    setLoading(true);
    try {
      const response = await getCurrentUser();
      if (response.success && response.data) {
        const email = response.data.email || "";
        setUserEmail(email);
        if (response.data.addresses) {
          setAddresses(mapAddresses(response.data.addresses, email));
        }
      }
    } catch (error) {
      console.error("Failed to fetch addresses:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const handleEdit = (id: string | number) => {
    const addressToEdit = addresses.find((a) => a.id === id);
    if (addressToEdit) {
      setEditingAddress({
        firstName: addressToEdit.firstName,
        lastName: addressToEdit.lastName,
        phoneNumber: addressToEdit.phoneNumber || addressToEdit.phone,
        address: addressToEdit.addressLine1 || addressToEdit.address,
        pincode: addressToEdit.postalCode || addressToEdit.pincode,
        city: addressToEdit.city,
        state: addressToEdit.state,
        country: addressToEdit.country,
        addressType: addressToEdit.addressType,
        isDefault: addressToEdit.isDefault,
        _id: addressToEdit._id,
      });
      setIsModalOpen(true);
    }
  };

  const handleDelete = async (id: string | number) => {
    if (!confirm("Are you sure you want to delete this address?")) return;
    try {
      const response = await deleteAddress(String(id));
      if (response.success) {
        if (response.data) {
          setAddresses(mapAddresses(response.data, userEmail));
        } else {
          fetchAddresses();
        }
      }
    } catch (error) {
      console.error("Failed to delete address:", error);
    }
  };

  const handleSetDefault = async (id: string | number) => {
    try {
      const response = await setDefaultAddress(String(id));
      if (response.success) {
        if (response.data) {
          setAddresses(mapAddresses(response.data, userEmail));
        } else {
          fetchAddresses();
        }
      }
    } catch (error) {
      console.error("Failed to set default address:", error);
    }
  };

  const handleSaveAddress = async (data: any) => {
    try {
      const payload = {
        firstName: data.firstName,
        lastName: data.lastName,
        phoneNumber: data.phoneNumber,
        addressLine1: data.address,
        city: data.city,
        state: data.state,
        country: data.country,
        postalCode: data.pincode,
        addressType: data.addressType,
        isDefault: data.isDefault,
      };

      const response = editingAddress
        ? await updateAddress(editingAddress._id, payload)
        : await addAddress(payload);

      if (response.success) {
        if (response.data) {
          setAddresses(mapAddresses(response.data, userEmail));
        } else {
          fetchAddresses();
        }
        setIsModalOpen(false);
        setEditingAddress(null);
      } else {
        alert("Failed to save address: " + (response.message || "Unknown error"));
      }
    } catch (error) {
      console.error("Failed to save address:", error);
      alert("An error occurred while saving the address.");
    }
  };

  const openNewAddressModal = () => {
    setEditingAddress(null);
    setIsModalOpen(true);
  };

  return (
    <div className="w-full px-4 lg:px-6">
      <div className="flex justify-between items-center mb-6">
        <h4 className="text-xl font-semibold text-gray-900">Select Address</h4>
        <button
          onClick={openNewAddressModal}
          className="text-[#a97f0f] font-semibold hover:text-[#8b6b2f] transition-colors cursor-pointer text-sm sm:text-base"
        >
          + Add New Address
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10">Loading addresses...</div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {addresses.length === 0 && (
            <div className="text-center text-gray-500 py-4">
              No addresses saved yet.
            </div>
          )}
          {addresses.map((address) => (
            <AddressCard
              key={address.id}
              address={address}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onSetDefault={handleSetDefault}
            />
          ))}
        </div>
      )}

      <AddAddressModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingAddress(null);
        }}
        onSave={handleSaveAddress}
        initialData={editingAddress}
      />
    </div>
  );
};

export default AddressesPage;