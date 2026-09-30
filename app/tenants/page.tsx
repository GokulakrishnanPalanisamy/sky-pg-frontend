import type { Metadata } from "next";
import { TenantsPage } from "@/components/tenants/tenants-page";

export const metadata: Metadata = { title: "Tenants" };

export default function Page() {
  return <TenantsPage />;
}
