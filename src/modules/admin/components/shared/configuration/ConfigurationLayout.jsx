import React from "react";
import { cn } from "@/lib/utils";

/** Content frame for config/procurement pages — no extra outer padding (AdminLayout already pads). */
export default function ConfigurationLayout({ children, className }) {
  return (
    <div className={cn("page-enter flex w-full flex-col gap-6", className)}>
      {children}
    </div>
  );
}
