import type { Metadata } from "next";
import { Inter, Oswald } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const oswald = Oswald({
  subsets: ["latin"],
  variable: "--font-oswald",
});

export const metadata: Metadata = {
  title: "ViralClip - AI Video Engine for Shopify",
  description: "Generate viral marketing videos for your Shopify products with AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${oswald.variable} font-sans antialiased bg-zinc-950 text-zinc-100 min-h-screen`}
      >
        {children}
      </body>
    </html>
  );
}
