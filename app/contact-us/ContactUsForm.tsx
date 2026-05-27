"use client";

import { useState } from "react";
import toast from "react-hot-toast";

import {
  submitContactEnquiry,
  type ContactEnquiryPayload,
} from "../services/contactEnquiryService";

const INITIAL_FORM: ContactEnquiryPayload = {
  name: "",
  email: "",
  phone: "",
  query: "",
};

const inputClassName =
  "w-full border border-[#000000a3] rounded-[50px] px-[15px] py-[10px] text-left text-[#727272] bg-[#ffffff36] focus:outline-none";

const ContactUsForm = () => {
  const [form, setForm] = useState<ContactEnquiryPayload>(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target;
    setForm((previous) => ({
      ...previous,
      [name]: name === "phone" ? value.replace(/\D/g, "").slice(0, 10) : value,
    }));
    if (isSubmitted) setIsSubmitted(false);
  };

  const validate = () => {
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

    if (!form.phone.trim()) {
      toast.error("Phone number is required.");
      return false;
    }

    const normalizedPhone = form.phone.replace(/\D/g, "");
    if (normalizedPhone.length !== 10) {
      toast.error("Please enter a valid phone number.");
      return false;
    }

    if (!form.query.trim()) {
      toast.error("Query is required.");
      return false;
    }

    return true;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await submitContactEnquiry({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        query: form.query.trim(),
      });

      setForm(INITIAL_FORM);
      setIsSubmitted(true);
      toast.success("Your query has been submitted.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to submit contact enquiry";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="text-left w-full md:w-[80%] mx-auto" onSubmit={handleSubmit}>
      <div className="flex flex-wrap -mx-4 mb-[30px]">
        <div className="w-full md:w-1/2 px-4 mb-4 md:mb-0">
          <label className="block mb-[7px] text-[14px]">Name*</label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Your Name"
            className={inputClassName}
            required
          />
        </div>
        <div className="w-full md:w-1/2 px-4">
          <label className="block mb-[7px] text-[14px]">Email ID*</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Your Email ID"
            className={inputClassName}
            required
          />
        </div>
      </div>

      <div className="flex flex-wrap -mx-4 mb-[30px]">
        <div className="w-full px-4">
          <label className="block mb-[7px] text-[14px]">Phone No.*</label>
          <input
            type="tel"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="Your contact no."
            inputMode="numeric"
            pattern="[0-9]{10}"
            maxLength={10}
            autoComplete="tel"
            className={inputClassName}
            required
          />
        </div>
      </div>

      <div className="flex flex-wrap -mx-4 mb-[30px]">
        <div className="w-full px-4">
          <label className="block mb-[7px] text-[14px]">Query</label>
          <textarea
            rows={5}
            name="query"
            value={form.query}
            onChange={handleChange}
            placeholder="Message"
            className={inputClassName}
            required
          />
        </div>
      </div>

      {isSubmitted && (
        <p className="text-center text-[#1f7a1f] text-[14px] mb-4">
          Thank you. Our team will contact you shortly.
        </p>
      )}

      <div className="text-center mt-3 mb-5">
        <button
          type="submit"
          disabled={isSubmitting}
          className="cursor-pointer inline-block w-auto border border-black rounded-[10px] px-[27px] py-[5px] text-[18px] font-normal hover:bg-[#18a149bf] hover:text-white hover:border-[#18a149bf] transition-all bg-transparent disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Submitting..." : "Submit"}
        </button>
      </div>
    </form>
  );
};

export default ContactUsForm;
