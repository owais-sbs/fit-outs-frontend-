import React from "react";
import { cn } from "@/lib/utils";

export default function ConfigurationLayout({ children, className }) {
  return (
    <div className={cn("page-enter flex h-full w-full flex-col gap-6 p-6", className)}>
      {children}
    </div>
  );
}
