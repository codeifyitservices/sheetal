import React, { useState } from "react";
import Image from "next/image";
import { submitEnquiry } from "@/app/services/enquireService";

interface EnquireModalProps {
  isOpen: boolean;
  onClose: () => void;
  productTitle: string;
  sizes?: { name: string }[];
  defaultSize?: string;
}

const EnquireModal: React.FC<EnquireModalProps> = ({
  isOpen,
  onClose,
  productTitle,
  sizes = [],
  defaultSize = "",
}) => {
  const [selectedSize, setSelectedSize] = useState(defaultSize);
  const [name, setName]       = useState("");
  const [email, setEmail]     = useState("");
  const [phone, setPhone]     = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted]       = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setSelectedSize(defaultSize);
    }
  }, [isOpen, defaultSize]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSize && sizes.length > 0) {
        alert("Please select a size.");
        return;
    }

    setIsSubmitting(true);
    try {
        await submitEnquiry({
            productName: productTitle,
            size: selectedSize,
            name: name.trim(),
            email: email.trim(),
            phone: phone.trim(),
            message: message.trim(),
        });
        setSubmitted(true);
        setTimeout(() => {
            setSubmitted(false);
            setName(""); setEmail(""); setPhone("");
            setMessage(""); setSelectedSize("");
            onClose();
        }, 2500);
    } catch (err: any) {
        alert(err.message || "Something went wrong. Please try again.");
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/60 flex items-center justify-center">
      <div className="relative w-[520px] h-[520px] rounded-full bg-[#f7f3ee] border-[3px] border-[#f5a623] flex flex-col items-center justify-center px-20">
        <button
          onClick={onClose}
          className="absolute -top-4 -right-4 w-10 h-10 bg-white rounded-full shadow flex items-center justify-center text-xl text-[#fe5722]"
          aria-label="Close"
        >
          ×
        </button>

        <h3 className="text-2xl font-medium mb-2 font-[family-name:var(--font-optima)]">
          Enquire Form
        </h3>
        <div className="w-24 h-px bg-gray-400 mb-4" />

        {submitted ? (
          <div className="flex flex-col items-center gap-3 py-4">
            <div className="w-14 h-14 rounded-full bg-[#f5a623] flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <p className="text-[#5a3e10] font-semibold text-base">Enquiry Sent!</p>
            <p className="text-gray-500 text-sm text-center">We'll get back to you shortly.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="w-full space-y-3 text-sm">
            <input
              type="text"
              value={productTitle}
              disabled
              className="w-full rounded-full border border-gray-700 px-4 py-2 bg-transparent text-center text-xs"
            />

            {sizes.length > 0 && (
              <select
                value={selectedSize}
                onChange={(e) => setSelectedSize(e.target.value)}
                required
                className="w-full rounded-full border border-gray-700 px-4 py-2 bg-transparent text-sm text-gray-700"
              >
                <option value="">Select Size</option>
                {sizes.map((s) => (
                  <option key={s.name} value={s.name}>{s.name}</option>
                ))}
              </select>
            )}

            <input
              type="text" placeholder="Name" required
              value={name} onChange={(e) => setName(e.target.value)}
              className="w-full rounded-full border border-gray-700 px-4 py-2 bg-transparent"
            />
            <input
              type="email" placeholder="Email" required
              value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-full border border-gray-700 px-4 py-2 bg-transparent"
            />
            <input
              type="text" placeholder="Phone Number" maxLength={10} required
              value={phone} onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-full border border-gray-700 px-4 py-2 bg-transparent"
            />
            <textarea
              placeholder="Message" rows={2}
              value={message} onChange={(e) => setMessage(e.target.value)}
              className="w-full rounded-full border border-gray-700 px-4 py-2 bg-transparent resize-none"
            />

            <button
              type="submit"
              disabled={isSubmitting}
              className="mx-auto mt-3 cursor-pointer block w-40 py-2 text-sm font-medium border-y border-black text-black uppercase transition-all duration-500 hover:tracking-[2px] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Sending..." : "Enquire Now"}
            </button>
          </form>
        )}

        <div className="absolute -bottom-2 -left-15">
          <Image src="/assets/popu-element-img.png" alt="Saree" width={260} height={360} className="object-contain" />
        </div>
      </div>
    </div>
  );
};

export default EnquireModal;