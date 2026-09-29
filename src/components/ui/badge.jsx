import * as React from "react"
import { cva } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-lg border-0 px-2.5 py-0.5 text-xs font-semibold leading-4 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
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
          "bg-success/15 text-success-foreground",
        warning:
          "bg-warning/15 text-warning-foreground",
        danger:
          "bg-destructive/15 text-destructive",
        info:
          "bg-info/15 text-info-foreground",
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
