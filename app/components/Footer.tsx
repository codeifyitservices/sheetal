"use client";

import { useEffect, useState } from "react";
import { API_BASE_URL } from "../services/api";
import FooterClient, {
  type FooterBlock,
  type RawFooterBlock,
} from "./FooterClient";

const defaultLayout: FooterBlock[] = [
  {
    id: "double-col",
    type: "double",
    title: "Information",
    hidden: false,
    columns: [
      {
        id: "sub-1",
        hidden: false,
        links: [
          { id: "1", label: "Our Story", href: "/about-us#our-story" },
          { id: "2", label: "Blog", href: "/blog" },
          { id: "3", label: "FAQ's", href: "/faq" },
          { id: "4", label: "Contact us", href: "/contact-us" },
        ],
      },
      {
        id: "sub-2",
        hidden: false,
        links: [
          { id: "5", label: "My Account", href: "/my-account" },
          { id: "6", label: "Track Order", href: "/track-order" },
          { id: "7", label: "Return Order", href: "/return-order" },
          { id: "8", label: "Sitemap", href: "/sitemap" },
        ],
      },
    ],
  },
  {
    id: "single-col",
    type: "single",
    title: "Quick Links",
    hidden: false,
    links: [
      { id: "9", label: "Privacy Policy", href: "/privacy-policy" },
      { id: "10", label: "Return & Exchange Policy", href: "/return-exchange-policy" },
      { id: "11", label: "Shipping Policy", href: "/shipping-policy" },
      { id: "12", label: "Terms of Use", href: "/terms-and-conditions" },
    ],
  },
];

const isNewFormat = (layout: RawFooterBlock[]): layout is FooterBlock[] =>
  layout.length > 0 &&
  (layout[0].type === "double" || layout[0].type === "single");

const isOldFlatFormat = (layout: RawFooterBlock[]): boolean =>
  layout.length > 0 &&
  !layout[0].hasOwnProperty("type") &&
  Array.isArray(layout[0].links);

const convertOldToNew = (old: RawFooterBlock[]): FooterBlock[] => {
  const isValidFooterLink = (
    link: FooterBlock["type"] extends never ? never : {
      id?: string;
      label?: string;
      href?: string;
      hidden?: boolean;
    },
  ): link is {
    id: string;
    label: string;
    href: string;
    hidden?: boolean;
  } => Boolean(link?.id && link?.label && link?.href);

  const doubleBlock: FooterBlock = {
    id: "double-col",
    type: "double",
    title: old[0]?.title || "Information",
    hidden: false,
    columns: old.slice(0, 2).map((section, index) => ({
      id: section.id || `sub-${index}`,
      hidden: section.hidden || false,
      links: (section.links || [])
        .filter(isValidFooterLink)
        .filter((link) => !link.hidden),
    })),
  };

  const thirdBlock = old[2];
  const singleBlock: FooterBlock = thirdBlock
    ? {
        id: thirdBlock.id || "single-col",
        type: "single",
        title: thirdBlock.title || "Quick Links",
        hidden: thirdBlock.hidden || false,
        links: (thirdBlock.links || [])
          .filter(isValidFooterLink)
          .filter((link) => !link.hidden),
      }
    : {
        id: "single-col",
        type: "single",
        title: "Quick Links",
        hidden: false,
        links: [],
      };

  return [doubleBlock, singleBlock];
};

async function getFooterData(): Promise<{ layout: FooterBlock[]; whatsapp?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/settings`, {
      next: { revalidate: 300 },
    });
    const settingsJson = await response.json();
    const settings = settingsJson?.data || {};
    const raw = (settings.footerLayout || []) as RawFooterBlock[];
    const whatsapp = settings.supportWhatsapp;

    if (!Array.isArray(raw) || raw.length === 0) {
      return { layout: defaultLayout, whatsapp };
    }

    const hasNavbarStructure =
      raw[0].hasOwnProperty("isDroppable") ||
      raw[0].hasOwnProperty("children");
    if (hasNavbarStructure) {
      return { layout: defaultLayout, whatsapp };
    }

    if (isNewFormat(raw)) {
      return { layout: raw, whatsapp };
    }

    if (isOldFlatFormat(raw)) {
      return { layout: convertOldToNew(raw), whatsapp };
    }

    return { layout: defaultLayout, whatsapp };
  } catch {
    return { layout: defaultLayout };
  }
}

const Footer = () => {
  const [isMounted, setIsMounted] = useState(false);
  const [layout, setLayout] = useState<FooterBlock[]>(defaultLayout);
  const [whatsapp, setWhatsapp] = useState<string | undefined>();

  useEffect(() => {
    let isActive = true;

    setIsMounted(true);

    const loadFooter = async () => {
      const data = await getFooterData();
      if (!isActive) return;
      setLayout(data.layout);
      setWhatsapp(data.whatsapp);
    };

    void loadFooter();

    return () => {
      isActive = false;
    };
  }, []);

  if (!isMounted) {
    return <div className="mt-20 w-full bg-[#082722]" aria-hidden="true" />;
  }

  return <FooterClient layout={layout} whatsapp={whatsapp} />;
};

export default Footer;
