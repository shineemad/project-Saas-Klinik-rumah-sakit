import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import { Providers } from "./providers";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: {
    default: "KlinikOS — Sistem Manajemen Klinik",
    template: "%s | KlinikOS",
  },
  description:
    "Platform SaaS manajemen klinik & rumah sakit modern untuk Indonesia. Rekam medis, antrian, farmasi, billing dalam satu sistem.",
  applicationName: "KlinikOS",
  authors: [{ name: "KlinikOS Team" }],
  keywords: ["SIMRS", "klinik", "rekam medis", "EMR", "SaaS kesehatan", "BPJS"],
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={inter.variable}>
      <body>
        <Providers>{children}</Providers>
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
