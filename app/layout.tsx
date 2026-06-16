import type { Metadata, Viewport } from "next";
import type { CSSProperties } from "react";
import { Montserrat, Outfit, Cinzel } from "next/font/google";
import localFont from "next/font/local";
import { Toaster } from "react-hot-toast";
import StorefrontHeader from "./components/StorefrontHeader";
import "./globals.css";
import GlobalWidgets from "./components/GlobalWidgets";

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

export const metadata: Metadata = {
  title: "Studio By Sheetal",
  description: "Made by Prableen Singh",
  icons: {
    icon: "/assets/335014072.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
