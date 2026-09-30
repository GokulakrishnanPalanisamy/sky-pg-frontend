import { Building2 } from "lucide-react";

export function BrandMark({ size = "md" }: { size?: "sm" | "md" }) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-teal-400 to-teal-600 text-white shadow-lg shadow-teal-900/30 ${
        size === "sm" ? "size-8" : "size-10"
      }`}
      aria-hidden
    >
      <Building2 className={size === "sm" ? "size-4" : "size-5"} />
    </span>
  );
}
