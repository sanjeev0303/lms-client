import QueryProvider from "@/providers/query-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/global/navbar";
import { ToastProvider } from "@/providers/toast-provider";
import PerformanceOptimizer from "@/components/global/performance-optimizer";
import ServerStatus from "@/components/global/server-status";
import { AuthProvider } from "@/components/auth/AuthProvider";

// Remove Google Fonts imports to fix Turbopack issues
// Use system fonts with CSS fallbacks for better reliability

export const metadata: Metadata = {
  title: "Premium LMS - Learn Without Limits",
  description:
    "A modern learning management system with premium design and enhanced user experience",
  keywords: ["LMS", "Learning", "Education", "Courses", "Online Learning"],
  authors: [{ name: "Premium LMS Team" }],
  creator: "Premium LMS",
  publisher: "Premium LMS",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  ),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title: "Premium LMS - Learn Without Limits",
    description:
      "A modern learning management system with premium design and enhanced user experience",
    siteName: "Premium LMS",
  },
  twitter: {
    card: "summary_large_image",
    title: "Premium LMS - Learn Without Limits",
    description:
      "A modern learning management system with premium design and enhanced user experience",
    creator: "@premiumlms",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <body
        className="min-h-screen bg-background font-sans antialiased"
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            <AuthProvider>
              <PerformanceOptimizer>
                <div className="relative flex min-h-screen flex-col">
                  <Navbar />
                  <ServerStatus className="mx-4 mt-2" />
                  <div className="flex-1">{children}</div>
                </div>
              </PerformanceOptimizer>
            </AuthProvider>
          </QueryProvider>
          <ToastProvider />
        </ThemeProvider>
      </body>
    </html>
  );
}
