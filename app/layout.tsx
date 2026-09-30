import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PgStoreProvider } from "@/context/pg-store";
import { ToastProvider } from "@/context/toast";
import { WorkspaceProvider } from "@/context/workspace";
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
  title: {
    default: "Sky PG Management",
    template: "%s · Sky PG",
  },
  description: "Manage PG rooms, beds, tenants and rent reminders.",
};

export const viewport: Viewport = {
  themeColor: "#070e1c",
  viewportFit: "cover",
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
            <WorkspaceProvider>
              <DashboardShell>{children}</DashboardShell>
            </WorkspaceProvider>
          </ToastProvider>
        </PgStoreProvider>
      </body>
    </html>
  );
}
