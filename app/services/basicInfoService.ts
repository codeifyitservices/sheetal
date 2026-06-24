import { apiFetch } from "./api";

export interface BasicInfoAddress {
  addressLine: string;
  pincode: string;
  city: string;
  state: string;
  country: string;
}

export interface BasicInfo {
  gstNumber: string;
  companyName: string;
  invoiceDeclaration: string;
  invoiceContactText: string;
  invoiceFooterYear: string;
  shippingAddress: BasicInfoAddress;
  billingAddress: BasicInfoAddress;
}

const emptyAddress = {
  addressLine: "",
  pincode: "",
  city: "",
  state: "",
  country: "",
};

const pickString = (...values: unknown[]) => {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
};

const normalizeAddress = (
  value: Partial<BasicInfoAddress> | Record<string, unknown> | string | null | undefined,
) => {
  if (!value) return emptyAddress;
  if (typeof value === "string") {
    return { ...emptyAddress, addressLine: value };
  }

  const v = value as Record<string, unknown>;

  return {
    addressLine: pickString(
      v.addressLine,
      v.addressLine1,
      v.address,
      v.line1,
      v.street,
    ),
    pincode: pickString(v.pincode, v.postalCode, v.zip, v.zipcode),
    city: pickString(v.city),
    state: pickString(v.state),
    country: pickString(v.country),
  };
};

export const getBasicInfo = async () => {
  const res = await apiFetch("/basic-info/public", { method: "GET" });

  if (!res?.success || !res?.data) {
    return {
      success: false,
      message: res?.message || "Unable to load basic info.",
    };
  }

  return {
    success: true,
    data: {
      gstNumber: pickString(
        res.data.gstNumber,
        res.data.gstinNumber,
        res.data.gstin,
        res.data.gstNo,
      ),
      companyName: pickString(res.data.companyName),
      invoiceDeclaration: pickString(res.data.invoiceDeclaration),
      invoiceContactText: pickString(res.data.invoiceContactText),
      invoiceFooterYear: pickString(res.data.invoiceFooterYear),
      shippingAddress: normalizeAddress(res.data.shippingAddress),
      billingAddress: normalizeAddress(res.data.billingAddress),
    } as BasicInfo,
  };
};
