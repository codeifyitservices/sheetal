"use client";

import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../services/api";
import { getLogoUrl } from "../services/settingsService";
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

async function getFooterData(): Promise<{
  layout: FooterBlock[];
  whatsapp?: string;
  logoUrl?: string;
}> {
  try {
    let settings: Record<string, any> = {};
    let footerPages: {
      _id: string;
      title: string;
      slug: string;
      footerPlacement: string;
    }[] = [];

    try {
      const settingsResponse = await fetch(`${API_BASE_URL}/settings`);
      const settingsJson = await settingsResponse.json();
      settings = settingsJson?.data || {};
    } catch {
      settings = {};
    }

    try {
      const pagesResponse = await fetch(`${API_BASE_URL}/pages/public/footer`);
      const pagesJson = await pagesResponse.json();
      footerPages = Array.isArray(pagesJson?.pages) ? pagesJson.pages : [];
    } catch {
      footerPages = [];
    }

    const raw = (settings.footerLayout || []) as RawFooterBlock[];
    const whatsapp = settings.supportWhatsapp;
    const logoUrl = getLogoUrl(settings);

    const appendStaticPages = (layout: FooterBlock[]): FooterBlock[] => {
      const nextLayout = JSON.parse(JSON.stringify(layout)) as FooterBlock[];
      nextLayout.forEach((block) => {
        if (block.type === "double") {
          block.columns.forEach((column) => {
            column.links = column.links.filter(
              (link) => !String(link.id || "").startsWith("static-page-"),
            );
          });
        } else {
          block.links = block.links.filter(
            (link) => !String(link.id || "").startsWith("static-page-"),
          );
        }
      });

      if (!footerPages.length) return nextLayout;

      const doubleBlock = nextLayout.find(
        (block): block is Extract<FooterBlock, { type: "double" }> =>
          block.type === "double",
      );
      const singleBlock = nextLayout.find(
        (block): block is Extract<FooterBlock, { type: "single" }> =>
          block.type === "single",
      );

      footerPages.forEach((page) => {
        if (page.footerPlacement === "footer_column_3") {
          if (!singleBlock) return;
          singleBlock.hidden = false;
          const href = `/${page.slug}`;
          if (singleBlock.links.some((link) => link.href === href)) return;
          singleBlock.links.push({
            id: `static-page-${page._id}`,
            label: page.title,
            href,
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
        });
      });

      return nextLayout;
    };

    if (!Array.isArray(raw) || raw.length === 0) {
      return { layout: appendStaticPages(defaultLayout), whatsapp, logoUrl };
    }

    const hasNavbarStructure =
      raw[0].hasOwnProperty("isDroppable") ||
      raw[0].hasOwnProperty("children");
    if (hasNavbarStructure) {
      return { layout: appendStaticPages(defaultLayout), whatsapp, logoUrl };
    }

    if (isNewFormat(raw)) {
      return { layout: appendStaticPages(raw), whatsapp, logoUrl };
    }

    if (isOldFlatFormat(raw)) {
      return { layout: appendStaticPages(convertOldToNew(raw)), whatsapp, logoUrl };
    }

    return { layout: appendStaticPages(defaultLayout), whatsapp, logoUrl };
  } catch {
    return { layout: defaultLayout };
  }
}

const Footer = () => {
  const [layout, setLayout] = useState<FooterBlock[]>(defaultLayout);
  const [whatsapp, setWhatsapp] = useState<string | undefined>();
  const [logoUrl, setLogoUrl] = useState<string | undefined>();

  useEffect(() => {
    let isActive = true;

    const loadFooter = async () => {
      const data = await getFooterData();
      if (!isActive) return;
      if (data.layout) setLayout(data.layout);
      if (data.whatsapp) setWhatsapp(data.whatsapp);
      if (data.logoUrl) setLogoUrl(data.logoUrl);
    };

    void loadFooter();

    return () => {
      isActive = false;
    };
  }, []);

  return (
    <FooterClient
      layout={layout}
      whatsapp={whatsapp}
      logoUrl={logoUrl}
    />
  );
};

export default Footer;
