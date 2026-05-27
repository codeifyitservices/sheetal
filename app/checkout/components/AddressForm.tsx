import React, { useState, useEffect } from "react";
import { addAddress, updateAddress } from "../../services/userService";
import toast from "react-hot-toast";

interface AddressFormData {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  addressLine1: string;
  postalCode: string;
  city: string;
  state: string;
  country: string;
  addressType: "Home" | "Office" | "Other";
  isDefault: boolean;
}

type AddressType = AddressFormData["addressType"];

interface AddressFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: AddressFormData & { _id?: string };
  addressId?: string;
}

const AddressForm: React.FC<AddressFormProps> = ({
  onSuccess,
  onCancel,
  initialData,
  addressId,
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<AddressFormData>({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    addressLine1: "",
    postalCode: "",
    city: "",
    state: "",
    country: "India",
    addressType: "Home",
    isDefault: false,
  });

  // Populate form with initial data when editing
  useEffect(() => {
    if (initialData) {
      setFormData({
        firstName: initialData.firstName || "",
        lastName: initialData.lastName || "",
        phoneNumber: initialData.phoneNumber || "",
        addressLine1: initialData.addressLine1 || "",
        postalCode: initialData.postalCode || "",
        city: initialData.city || "",
        state: initialData.state || "",
        country: initialData.country || "India",
        addressType: initialData.addressType || "Home",
        isDefault: initialData.isDefault || false,
      });
    }
  }, [initialData]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "phoneNumber"
          ? value.replace(/\D/g, "").slice(0, 10)
          : name === "postalCode"
            ? value.replace(/\D/g, "").slice(0, 6)
            : value,
    }));
  };

  const handleTypeSelect = (type: AddressType) => {
    setFormData((prev) => ({ ...prev, addressType: type }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simple validation
    if (
      !formData.firstName ||
      !formData.phoneNumber ||
      !formData.addressLine1 ||
      !formData.postalCode
    ) {
      toast.error("Please fill in all required fields.");
      setLoading(false);
      return;
    }

    if (!/^\d{10}$/.test(formData.phoneNumber)) {
      toast.error("Mobile number must be exactly 10 digits.");
      setLoading(false);
      return;
    }

    if (!/^\d{6}$/.test(formData.postalCode)) {
      toast.error("Pincode must be exactly 6 digits.");
      setLoading(false);
      return;
    }

    try {
      let response;
      if (addressId) {
        // Update existing address
        response = await updateAddress(addressId, formData);
        if (response.success) {
          toast.success("Address updated successfully!");
          onSuccess();
        } else {
          toast.error(response.message || "Failed to update address.");
        }
      } else {
        // Add new address
        response = await addAddress(formData);
        if (response.success) {
          toast.success("Address added successfully!");
          onSuccess();
        } else {
          toast.error(response.message || "Failed to add address.");
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-4"
    >
      <h3 className="text-[24px] text-[#70480c] font-medium mb-4 font-[family-name:var(--font-montserrat)]">
        {addressId ? "Edit Address" : "Add New Address"}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-[15px] font-[family-name:var(--font-montserrat)] font-medium text-gray-700 mb-1">
            First Name *
          </label>
          <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            className="w-full border-b bg-white h-14 border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#bd9951]"
            required
          />
        </div>
        <div>
          <label className="block text-[15px] font-[family-name:var(--font-montserrat)] font-medium text-gray-700 mb-1">
            Last Name *
          </label>
          <input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            className="w-full border-b bg-white h-14 border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#bd9951]"
            required
          />
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-[15px] font-[family-name:var(--font-montserrat)] font-medium text-gray-700 mb-1">
          Enter Mobile Number *
        </label>
        <input
          type="tel"
          name="phoneNumber"
          value={formData.phoneNumber}
          onChange={handleChange}
          inputMode="numeric"
          pattern="[0-9]{10}"
          maxLength={10}
          autoComplete="tel"
          className="w-full border-b bg-white h-14 border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#bd9951]"
          required
        />
        <p className="text-[13px] italic font-[family-name:var(--font-montserrat)] text-gray-500 mt-1">
          This phone number will be used to send you offers & updates
        </p>
      </div>

      <div className="mb-4">
        <label className="block text-[15px] font-[family-name:var(--font-montserrat)] font-medium text-gray-700 mb-1">
          Address *
        </label>
        <textarea
          name="addressLine1"
          value={formData.addressLine1}
          onChange={handleChange}
          rows={3}
          className="w-full border-b bg-white border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#bd9951]"
          required
        ></textarea>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-[15px] font-[family-name:var(--font-montserrat)] font-medium text-gray-700 mb-1">
            Pincode *
          </label>
          <input
            type="text"
            name="postalCode"
            value={formData.postalCode}
            onChange={handleChange}
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            className="w-full border-b bg-white h-14 border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#bd9951]"
            required
          />
        </div>
        <div>
          <label className="block text-[15px] font-[family-name:var(--font-montserrat)] font-medium text-gray-700 mb-1">
            City *
          </label>
          <input
            type="text"
            name="city"
            value={formData.city}
            onChange={handleChange}
            className="w-full border-b bg-white h-14 border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#bd9951]"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-[15px] font-[family-name:var(--font-montserrat)] font-medium text-gray-700 mb-1">
            State *
          </label>
          <input
            type="text"
            name="state"
            value={formData.state}
            onChange={handleChange}
            className="w-full border-b bg-white h-14 border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#bd9951]"
            required
          />
        </div>
        <div>
          <label className="block text-[15px] font-[family-name:var(--font-montserrat)] font-medium text-gray-700 mb-1">
            Country *
          </label>
          <input
            type="text"
            name="country"
            value={formData.country}
            onChange={handleChange}
            className="w-full border-b bg-white h-14 border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#bd9951]"
            required
          />
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-[15px] font-[family-name:var(--font-montserrat)] font-medium text-gray-700 mb-2">
          Save this address as (optional)
        </label>
        <div className="flex gap-3">
          {(["Home", "Office", "Other"] as AddressType[]).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => handleTypeSelect(type)}
              className={`px-4 py-1.5 rounded-full text-[15px] font-[family-name:var(--font-montserrat)] border transition-colors ${
                formData.addressType === type
                  ? "bg-transparent text-[#bd9951] border-[#bd9951]"
                  : "bg-white text-black border-gray-300 hover:bg-transparent hover:text-[#bd9951] hover:border-[#bd9951]"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6 flex items-center">
        <input
          type="checkbox"
          id="isDefault"
          name="isDefault"
          checked={formData.isDefault}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, isDefault: e.target.checked }))
          }
          className="mr-2 h-4 w-4"
        />
        <label htmlFor="isDefault" className="text-sm text-gray-700">
          Make this my default address
        </label>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 cursor-pointer bg-[#72561e] text-white py-3 rounded text-sm font-semibold hover:bg-[#a38038] transition-colors disabled:opacity-50"
        >
          {loading
            ? "Saving..."
            : addressId
              ? "UPDATE & CONTINUE"
              : "SAVE & CONTINUE"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 cursor-pointer bg-gray-200 text-gray-800 py-3 rounded text-sm font-semibold hover:bg-gray-300 transition-colors"
        >
          CANCEL
        </button>
      </div>
    </form>
  );
};

export default AddressForm;
