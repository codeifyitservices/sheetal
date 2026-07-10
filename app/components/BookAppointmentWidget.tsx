"use client";

import React, { useState } from "react";
import { bookAppointment } from "../services/appointmentServices";
import toast from "react-hot-toast";
import { X } from "lucide-react";

interface AppointmentForm {
  name: string;
  email: string;
  contact: string;
  address: string;
  city: string;
  pincode: string;
  requirement: string;
}

const INITIAL_FORM: AppointmentForm = {
  name: "",
  email: "",
  contact: "",
  address: "",
  city: "",
  pincode: "",
  requirement: "",
};

const inputClass =
  "w-full bg-transparent border-b border-[#ffa624] text-sm text-gray-700 placeholder-gray-400 py-2 outline-none focus:border-[#8a6e2f] transition-colors";

const Label = ({ text }: { text: string }) => (
  <span className="text-xs text-gray-500 mb-0.5 block">
    {text} <span className="text-red-500">*</span>
  </span>
);

const BookAppointmentWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState<AppointmentForm>(INITIAL_FORM);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]:
        name === "contact"
          ? value.replace(/\D/g, "").slice(0, 10)
          : name === "pincode"
            ? value.replace(/\D/g, "").slice(0, 6)
          : value,
    }));
  };

  const validate = (): boolean => {
    if (!form.name.trim()) {
      toast.error("Name is required.");
      return false;
    }
    if (!form.email.trim()) {
      toast.error("Email is required.");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email.trim())) {
      toast.error("Please enter a valid email address.");
      return false;
    }
    if (!form.contact.trim()) {
      toast.error("Contact number is required.");
      return false;
    }
    if (!/^\d{10}$/.test(form.contact.trim())) {
      toast.error("Contact must be a 10-digit number.");
      return false;
    }
    if (!form.address.trim()) {
      toast.error("Address is required.");
      return false;
    }
    if (!form.city.trim()) {
      toast.error("City is required.");
      return false;
    }
    if (!form.pincode.trim()) {
      toast.error("Pincode is required.");
      return false;
    }
    if (!/^\d{6}$/.test(form.pincode.trim())) {
      toast.error("Pincode must be a 6-digit number.");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await bookAppointment({
        name: form.name.trim(),
        email: form.email.trim(),
        contact: form.contact.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        pincode: form.pincode.trim(),
        requirements: form.requirement.trim(),
      });

      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setIsOpen(false);
        setForm(INITIAL_FORM);
      }, 2500);
    } catch (err: any) {
      toast.error(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setForm(INITIAL_FORM);
    setSubmitted(false);
  };

  return (
    <>
      {/* Floating trigger */}
      <div className="fixed bottom-18 right-6" style={{ zIndex: 9998, isolation: "isolate" }}>
        <div className="relative inline-block">
          <span
            className="absolute -top-2 left-0 px-1.5 text-[10px] uppercase text-black font-extrabold font-[family-name:var(--font-montserrat)] whitespace-nowrap"
            style={{ background: "#ffffff", zIndex: "99" }}
          >
            For Customization
          </span>
          <button
            onClick={() => setIsOpen(true)}
            className="border border-black shadow-lg px-4 py-2.5 text-[12px] font-[family-name:var(--font-montserrat)] font-bold transition-colors tracking-wide whitespace-nowrap cursor-pointer"
            style={{
              background: "rgba(189, 153, 81, 0.15)",
              backdropFilter: "blur(80px)",
              WebkitBackdropFilter: "blur(80px)",
              color: "#000000",
            }}
          >
            Book Appointment
          </button>
        </div>
      </div>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 flex items-center justify-center"
          style={{
            zIndex: 99999,
            backgroundColor: "#362000d1",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
          }}
          onClick={handleClose}
        >
          {/* Modal */}
          <div
            className="relative w-full max-w-lg mx-4 rounded-4xl border-4 border-[#ffa624] p-8 overflow-y-auto max-h-[90vh]"
            style={{ backgroundColor: "#f7f0e3" }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleClose}
              className="absolute top-4 right-5 text-[#ffa624] cursor-pointer text-xl font-light hover:text-[#ffa624] transition-colors"
              aria-label="Close"
            >
              <X/>
            </button>

            {submitted ? (
              <>
                <h2 className="font-semibold text-[#5a3e10] mb-6 tracking-wide text-center text-2xl font-optima">
                  Thank You!
                </h2>
                <div className="flex flex-col items-center justify-center py-6 gap-4">
                  <div className="w-16 h-16 rounded-full bg-[#bd9951] flex items-center justify-center shadow-md">
                    <svg
                      width="32"
                      height="32"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="white"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <p className="text-[#5a3e10] font-semibold text-center text-lg mt-2 font-optima leading-snug">
                    Your appointment request has been submitted successfully.
                  </p>
                  <p className="text-gray-600 text-sm text-center leading-relaxed max-w-sm font-[family-name:var(--font-montserrat)]">
                    Our team will review your request and get back to you soon with the confirmation details.
                  </p>
                </div>
              </>
            ) : (
              <>
                <h2 className="font-semibold text-[#5a3e10] mb-1 tracking-wide">
                  Book An Appointment
                </h2>
                <p className="text-xs text-gray-400 mb-6">
                  Fields marked <span className="text-red-500">*</span> are required
                </p>
                <div className="flex flex-col gap-5">
                <div>
                  <Label text="Name" />
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Your full name"
                    className={inputClass}
                  />
                </div>

                <div>
                  <Label text="Email" />
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    className={inputClass}
                  />
                </div>

                <div>
                  <Label text="Contact" />
                  <input
                    name="contact"
                    type="tel"
                    value={form.contact}
                    onChange={handleChange}
                    placeholder="10-digit mobile number"
                    maxLength={10}
                    inputMode="numeric"
                    pattern="[0-9]{10}"
                    autoComplete="tel"
                    className={inputClass}
                  />
                </div>

                <div>
                  <Label text="Address" />
                  <input
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    placeholder="Street / locality"
                    className={inputClass}
                  />
                </div>

                <div className="flex gap-4">
                  <div className="flex-1">
                    <Label text="City" />
                    <input
                      name="city"
                      value={form.city}
                      onChange={handleChange}
                      placeholder="City"
                      className={inputClass}
                    />
                  </div>
                  <div className="flex-1">
                    <Label text="Pincode" />
                    <input
                      name="pincode"
                      type="text"
                      value={form.pincode}
                      onChange={handleChange}
                      placeholder="6-digit pincode"
                      inputMode="numeric"
                      pattern="[0-9]{6}"
                      maxLength={6}
                      className={inputClass}
                    />
                  </div>
                </div>

                <div>
                  <span className="text-xs text-gray-500 mb-0.5 block">
                    Your Requirement{" "}
                    <span className="text-gray-400 text-[10px]">(optional)</span>
                  </span>
                  <textarea
                    name="requirement"
                    value={form.requirement}
                    onChange={handleChange}
                    placeholder="Describe what you're looking for..."
                    rows={3}
                    className={inputClass}
                  />
                </div>

                <div className="flex justify-center mt-2">
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="px-8 py-2.5 border border-gray-800 text-black text-sm font-medium rounded-sm hover:bg-gray-800 hover:text-white transition-colors tracking-wide cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? "Booking..." : "Book Appointment"}
                  </button>
                </div>
              </div>
            </>
          )}
          </div>
        </div>
      )}
    </>
  );
};

export default BookAppointmentWidget;
