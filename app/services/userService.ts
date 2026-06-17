import { apiFetch } from "./api";
import { updateUserDetailsInLocalStorage } from "./authService";

export interface User {
  _id: string;
  name: string;
  email?: string;
}

export const updateUserProfile = async (userData: any | FormData) => {
  const options: RequestInit = {
    method: "PUT",
  };

  if (userData instanceof FormData) {
    options.body = userData;
  } else {
    options.headers = {
      "Content-Type": "application/json",
    };
    options.body = JSON.stringify(userData);
  }

  const response = await apiFetch("/users/update", options);
  if (response.success && response.data) {
    updateUserDetailsInLocalStorage(response.data);
  }
  return response;
};

export const getCurrentUser = async () => {
  return await apiFetch("/users/me", {
    method: "GET",
  });
};

export const addAddress = async (addressData: any) => {
  return await apiFetch("/users/address", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(addressData),
  });
};

export const updateAddress = async (addressId: string, addressData: any) => {
  return await apiFetch(`/users/address/${addressId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(addressData),
  });
};

export const deleteAddress = async (addressId: string) => {
  return await apiFetch(`/users/address/${addressId}`, {
    method: "DELETE",
  });
};

export const setDefaultAddress = async (addressId: string) => {
  return await apiFetch(`/users/address/${addressId}/default`, {
    method: "PUT",
  });
};

export const deleteAccount = async () => {
  return await apiFetch("/users/me", {
    method: "DELETE",
  });
};
