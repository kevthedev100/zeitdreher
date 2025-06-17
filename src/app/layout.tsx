import * as React from "react";
import { Inter } from "next/font/google";
import type { Metadata } from "next";
import "./globals.css";
import Script from "next/script";
import ErrorBoundary from "@/components/error-boundary";
import { TempoInit } from "./tempo-init";
import { ClerkProviderWrapper } from "@/components/providers/clerk-provider-wrapper";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Zeitdreher - KI-Zeittracking und Analyse",
  description:
    "Erfasse deine Zeit mühelos per Sprache und gewinne wertvolle KI-gestützte Erkenntnisse zur Produktivitätsoptimierung",
  icons: {
    icon: [
      {
        url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23000000' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='10'/%3E%3Cpolyline points='12,6 12,12 16,14'/%3E%3C/svg%3E",
        type: "image/svg+xml",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <head>
        <Script
          src="https://api.tempo.new/proxy-asset?url=https://storage.googleapis.com/tempo-public-assets/error-handling.js"
          strategy="beforeInteractive"
        />
        {/* Debug script to expose environment variables */}
        <Script id="debug-env" strategy="beforeInteractive">
          {`
            window.ENV_DEBUG = {
              NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "${process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? "Set" : "Not set"}",
              NEXT_PUBLIC_BYPASS_CLERK_AUTH: "${process.env.NEXT_PUBLIC_BYPASS_CLERK_AUTH || "Not set"}",
              NEXT_PUBLIC_SUPABASE_URL: "${process.env.NEXT_PUBLIC_SUPABASE_URL ? "Set" : "Not set"}",
              timestamp: new Date().toISOString()
            };
            console.log("[RootLayout] Environment debug:", window.ENV_DEBUG);
          `}
        </Script>
      </head>
      <body className={inter.className}>
        <ClerkProviderWrapper>
          <ErrorBoundary>
            {children}
            <TempoInit />
          </ErrorBoundary>
        </ClerkProviderWrapper>
      </body>
    </html>
  );
}
