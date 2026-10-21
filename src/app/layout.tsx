import type { Metadata, Viewport } from "next";
import { Space_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import ConvexClientProvider from "@/providers/ConvexClientProvider";

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "CatSync // Cat Care Tracker",
  description:
    "Real-time cat care tracker for roommates and shared households.",
  applicationName: "CatSync",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "CatSync",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${spaceMono.variable} h-full antialiased`}>
        <head>
          <link rel="icon" href="/icon.svg" type="image/svg+xml" />
          <link rel="apple-touch-icon" href="/icon-192x192.png" />
        </head>
        <body className="min-h-full flex flex-col font-mono bg-paper text-ink selection:bg-accent selection:text-white">
          <ConvexClientProvider>
            {children}
          </ConvexClientProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}