import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PgStoreProvider } from "@/context/pg-store";
import { ToastProvider } from "@/context/toast";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sky PG Management",
  description: "Frontend dashboard for managing PG rooms, beds, and tenants.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full font-sans">
        <PgStoreProvider>
          <ToastProvider>
            <DashboardShell>{children}</DashboardShell>
          </ToastProvider>
        </PgStoreProvider>
      </body>
    </html>
  );
}
