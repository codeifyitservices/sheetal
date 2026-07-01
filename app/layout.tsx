import type { Metadata, Viewport } from "next";
import type { CSSProperties } from "react";
import { Montserrat, Outfit, Cinzel } from "next/font/google";
import localFont from "next/font/local";
import { Toaster } from "react-hot-toast";
import StorefrontHeader from "./components/StorefrontHeader";
import "./globals.css";
import GlobalWidgets from "./components/GlobalWidgets";
import JsonLd from "./components/JsonLd";

const optima = localFont({
  src: [
    {
      path: "../public/assets/fonts/OPTIMA.woff",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/assets/fonts/OPTIMA_B.woff",
      weight: "700",
      style: "normal",
    },
    {
      path: "../public/assets/fonts/Optima Medium.woff",
      weight: "500",
      style: "normal",
    },
    {
      path: "../public/assets/fonts/Optima_Italic.woff",
      weight: "400",
      style: "italic",
    },
  ],
  variable: "--font-optima",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
});

const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["700"],
  variable: "--font-cinzel",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

import { getSettings, getFaviconUrl } from "./services/settingsService";
import { getSeoSettings } from "./services/seoSettingsService";
import { headers } from "next/headers";
import { buildGlobalSchema, parseSchemaString } from "./utils/schema";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  const seoSettings = await getSeoSettings();
  const faviconUrl = getFaviconUrl(settings);
  const title = seoSettings.websiteName || "Studio By Sheetal";
  const description =
    seoSettings.organizationDescription || "Studio By Sheetal";

  return {
    title,
    description,
    icons: {
      icon: faviconUrl,
    },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const seoSettings = await getSeoSettings();
  const globalSchema =
    parseSchemaString(seoSettings.schema) || buildGlobalSchema(seoSettings);

  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";

  const isSchemaLessPage = [
    "/cart",
    "/checkout",
    "/login",
    "/otp",
    "/my-account",
    "/wishlist",
    "/product-list",
    "/contact-us"
  ].some(path => pathname === path || pathname.startsWith(path + "/"));

  return (
    <html lang="en">
      <body
        className={`${optima.variable} ${montserrat.variable} ${outfit.variable} antialiased`}
        style={
          {
            "--font-geist-sans": "var(--font-montserrat), sans-serif",
            "--font-geist-mono": "Consolas, monospace",
          } as CSSProperties
        }
      >
        {isSchemaLessPage && <JsonLd data={globalSchema} />}
        <Toaster
          position="top-center"
          reverseOrder={false}
          containerStyle={{ zIndex: 999999 }}
        />
        <div className="storefront-header">
          <StorefrontHeader />
        </div>
        {children}
        <GlobalWidgets />
      </body>
    </html>
  );
}
