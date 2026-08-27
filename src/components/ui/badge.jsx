import * as React from "react"
import { cva } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-lg border-0 px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground",
        secondary:
          "bg-secondary text-secondary-foreground",
        destructive:
          "bg-destructive text-destructive-foreground",
        outline: "bg-transparent text-foreground ring-1 ring-inset ring-border",
        success:
          "bg-emerald-500/12 text-emerald-800",
        warning:
          "bg-amber-500/12 text-amber-800",
        danger:
          "bg-red-500/12 text-red-800",
        info:
          "bg-sky-500/12 text-sky-800",
        gold:
          "bg-copper/15 text-copper-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({ className, variant, ...props }) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants }
