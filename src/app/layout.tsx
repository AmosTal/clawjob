import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { ToastProvider } from "@/components/Toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "clawjob — Swipe Your Way to Your Dream Job",
    template: "%s | clawjob",
  },
  description:
    "Discover and apply to jobs with a simple swipe. clawjob makes job hunting fast, fun, and effective for job seekers and employers alike.",
  keywords: [
    "jobs",
    "job search",
    "career",
    "hiring",
    "recruitment",
    "swipe to apply",
    "job board",
  ],
  authors: [{ name: "clawjob" }],
  creator: "clawjob",
  publisher: "clawjob",
  metadataBase: new URL("https://clawjob-yb6z4mnc2q-uc.a.run.app"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://clawjob-yb6z4mnc2q-uc.a.run.app",
    siteName: "clawjob",
    title: "clawjob — Swipe Your Way to Your Dream Job",
    description: "Discover and apply to jobs with a simple swipe.",
    images: [
      { url: "/og-image.png", width: 1200, height: 630, alt: "clawjob" },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "clawjob — Swipe Your Way to Your Dream Job",
    description: "Discover and apply to jobs with a simple swipe.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <ToastProvider>{children}</ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
