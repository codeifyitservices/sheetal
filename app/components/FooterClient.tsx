"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSettings } from "../hooks/useSettings";
import { getLogoUrl } from "../services/settingsService";
import { usePathname } from "next/navigation";
import { ArrowUp } from "lucide-react";
import { createSubscriber } from "../services/newsletterServices";
import { fetchFooterStaticPages } from "../services/staticPageService";
import toast from "react-hot-toast";

export interface FooterLink {
  id: string;
  label: string;
  href: string;
  hidden?: boolean;
}

interface FooterSubColumn {
  id: string;
  hidden?: boolean;
  links: FooterLink[];
}

interface FooterDoubleBlock {
  id: string;
  type: "double";
  title: string;
  hidden?: boolean;
  columns: FooterSubColumn[];
}

interface FooterSingleBlock {
  id: string;
  type: "single";
  title: string;
  hidden?: boolean;
  links: FooterLink[];
}

export type FooterBlock = FooterDoubleBlock | FooterSingleBlock;

export type RawFooterBlock = {
  id?: string;
  title?: string;
  hidden?: boolean;
  type?: "double" | "single";
  links?: { id?: string; label?: string; href?: string; hidden?: boolean }[];
  columns?: {
    id?: string;
    hidden?: boolean;
    links?: { id?: string; label?: string; href?: string; hidden?: boolean }[];
  }[];
  isDroppable?: boolean;
  children?: unknown;
};

const FooterClient = ({
  layout,
  whatsapp,
}: {
  layout: FooterBlock[];
  whatsapp?: string;
}) => {
  const [resolvedLayout, setResolvedLayout] = useState(layout);
  const { settings } = useSettings();
  const logoUrl = getLogoUrl(settings);

  const [newsletterEmail, setNewsletterEmail] = useState("");
  const pathname = usePathname();
  const showBackToTop = pathname !== "/";

  const finalWhatsapp = whatsapp || "919958813913";

  useEffect(() => {
    setResolvedLayout(layout);
  }, [layout]);

  useEffect(() => {
    let isActive = true;

    const loadFooterPages = async () => {
      const pages = await fetchFooterStaticPages();
      if (!isActive || !pages.length) return;

      setResolvedLayout((currentLayout) => {
        const nextLayout = JSON.parse(JSON.stringify(currentLayout)) as FooterBlock[];
        const doubleBlock = nextLayout.find(
          (block): block is FooterDoubleBlock => block.type === "double",
        );
        const singleBlock = nextLayout.find(
          (block): block is FooterSingleBlock => block.type === "single",
        );


        pages.forEach((page) => {
          if (page.footerPlacement === "footer_column_3") {
            if (!singleBlock) return;
            singleBlock.hidden = false;
            const href = `/${page.slug}`;
            if (singleBlock.links.some((link) => link.href === href)) return;
            singleBlock.links.push({
              id: `static-page-${page._id}`,
              label: page.title,
              href,
              hidden: false,
            });
            return;
          }

          if (!doubleBlock) return;
          doubleBlock.hidden = false;
          const columnIndex =
            page.footerPlacement === "footer_column_2" ? 1 : 0;
          const column = doubleBlock.columns[columnIndex];
          if (!column) return;

          column.hidden = false;
          const href = `/${page.slug}`;
          if (column.links.some((link) => link.href === href)) return;
          column.links.push({
            id: `static-page-${page._id}`,
            label: page.title,
            href,
            hidden: false,
          });
        });

        return nextLayout;
      });
    };

    void loadFooterPages();

    return () => {
      isActive = false;
    };
  }, []);

  const handleSubscribe = async () => {
    if (!newsletterEmail.trim()) {
      return toast.error("Please enter your email");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newsletterEmail)) {
      return toast.error("Please enter a valid email address");
    }

    try {
      const response = await createSubscriber(newsletterEmail);
      if (!response.ok) {
        return toast.error("Email already exists");
      }
      toast.success("You have subscribed to our newsletter");
      setNewsletterEmail("");
    } catch {
      toast.error("Something went wrong, please try again");
    }
  };

  return (
    <>
      <footer
        className="w-full text-[#f8f0b4] font-[family-name:var(--font-montserrat)]"
        style={{
          backgroundImage: "url('/assets/footer-bg.jpg')",
          backgroundPosition: "center center",
          backgroundRepeat: "repeat",
        }}
      >
        <div className="container mx-auto px-4 py-12 sm:px-6">
          <div className="grid grid-cols-1 gap-5 text-left md:grid-cols-2 lg:grid-cols-5 lg:pr-10">
            <div className="flex flex-col items-center px-2 text-center md:border-r sm:px-4 lg:text-left">
              <Link href="/" className="mb-4">
                <Image
                  src={logoUrl}
                  alt="Studio By Sheetal"
                  width={180}
                  height={120}
                  className="lg:mx-0 h-[120px] w-[180px] object-contain"
                />
              </Link>
              <div className="flex justify-center gap-3 text-[#f8f0b6]">
                {["Fb", "In", "Pi", "Yt"].map((social, index) => (
                  <span key={social} className="flex gap-3">
                    <a
                      href="#"
                      target="_blank"
                      className="text-[15px] transition-colors hover:text-white font-[family-name:var(--font-montserrat)]"
                    >
                      {social}
                    </a>
                    {index < 3 && <span>-</span>}
                  </span>
                ))}
              </div>
            </div>

            <div className="px-0 sm:px-2 lg:col-span-3 lg:px-4">
              <div className="grid grid-cols-1 gap-6 text-left lg:grid-cols-2">
                {resolvedLayout
                  .filter((block) => !block.hidden)
                  .map((block) => {
                    if (block.type === "double") {
                      return (
                        <div key={block.id}>
                          <h3 className="mb-4 whitespace-nowrap text-[18px] font-normal leading-tight text-[#f8f0b4] font-optima sm:mb-6 sm:text-[22px]">
                            {block.title}
                          </h3>
                          <div className="grid grid-cols-2 border-y py-5 lg:border-none">
                            {block.columns
                              .filter((column) => !column.hidden)
                              .map((column) => (
                                <div
                                  key={column.id}
                                  className="flex flex-col gap-3 text-[#f8f0b6] sm:gap-4"
                                >
                                  {column.links
                                    .filter((link) => !link.hidden)
                                    .map((link) => (
                                      <Link
                                        key={link.id}
                                        href={link.href}
                                        className="text-[13px] font-light leading-snug tracking-wider transition-colors hover:text-white sm:text-[16px] font-[family-name:var(--font-montserrat)]"
                                      >
                                        {link.label}
                                      </Link>
                                    ))}
                                </div>
                              ))}
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={block.id}>
                        <h3 className="mb-4 whitespace-nowrap text-[18px] font-normal leading-tight text-[#f8f0b4] font-optima sm:mb-6 sm:text-[22px]">
                          {block.title}
                        </h3>
                        <div className="flex flex-col gap-1.5 border-y py-5 text-[#f8f0b6] lg:border-none sm:gap-2">
                          {block.links
                            .filter((link) => !link.hidden)
                            .map((link) => (
                              <Link
                                key={link.id}
                                href={link.href}
                                className="text-[13px] font-light leading-snug tracking-wide transition-colors hover:text-white sm:text-[16px]"
                              >
                                {link.label}
                              </Link>
                            ))}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            <div>
              <h3 className="mb-6 whitespace-nowrap text-[20px] font-normal text-[#f8f0b4] sm:text-[22px]">
                Subscribe to our newsletter
              </h3>
              <p className="mb-4 font-light text-[#f8f0b6] font-optima">
                Subscribe to get special offers, new products and sales deals.
              </p>
              <div className="flex w-full max-w-sm flex-col gap-3 border-b border-[#777] sm:w-3/4 sm:max-w-none sm:flex-row sm:items-end sm:gap-0">
                <input
                  value={newsletterEmail}
                  onChange={(event) => setNewsletterEmail(event.target.value)}
                  type="email"
                  placeholder="Your e-mail"
                  className="w-full min-w-38 bg-transparent font-light text-[#f8f0b6] outline-none placeholder:text-[#f8f0b4]"
                />
                <button
                  onClick={handleSubscribe}
                  className="self-start border border-[#f8f0b6] px-3 py-2 text-sm uppercase text-[#f8f0b6] transition-colors hover:text-white sm:ml-4 sm:self-auto"
                >
                  Subscribe
                </button>
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-col items-center justify-center gap-6 border-t border-[#f1e4a3]/30 pt-6 text-sm text-[#f1e4a3] lg:flex-row">
            <div className="flex items-center gap-2">
              <Image
                src="/assets/icons/security.svg"
                alt="Security"
                width={22}
                height={22}
              />
              100% Secure Payments
            </div>
            <div className="hidden h-4 w-px bg-[#f1e4a3] lg:block" />
            <div className="flex items-center border-l border-r border-[#f1e4a3] px-4 lg:border-none">
              <Image
                src="/assets/icons/payment-partners.svg"
                alt="Payment Partners"
                width={250}
                height={30}
                className="mr-4 pr-8 lg:border-r border-[#f1e4a3]"
              />
            </div>
            <div className="flex items-center gap-2">
              <Image src="/assets/icons/ssl.svg" alt="SSL" width={22} height={22} />
              256 BIT Encryption
            </div>
          </div>
        </div>

        <div className="border-t border-dashed border-[#2c2c2c] bg-[#faf8fc0d] py-3">
          <div className="container mx-auto px-4 text-left text-[13px] text-[#f8f0b4] sm:px-6">
            Copyright 2026 © Studio By Sheetal, All Rights Reserved.
          </div>
        </div>
      </footer>

      {showBackToTop && (
        <a
          href="#"
          className="fixed bottom-[20px] right-[30px] z-50 flex h-[40px] w-[40px] items-center justify-center rounded-full border border-[#90c03e] text-[#90c03e] transition-colors"
        >
          <ArrowUp />
        </a>
      )}

      <a
        target="_blank"
        href={`https://api.whatsapp.com/send?phone=${finalWhatsapp}`}
        rel="noopener"
        className="fixed bottom-[84px] left-[18px] z-[999]"
      >
        <Image
          src="/assets/icons/whatsapp.png"
          alt="WhatsApp chat"
          width={60}
          height={60}
        />
      </a>
    </>
  );
};

export default FooterClient;
