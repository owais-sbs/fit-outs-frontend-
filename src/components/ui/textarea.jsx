import * as React from "react"
import { cn, fieldControlClasses } from "@/lib/utils"

const Textarea = React.forwardRef(({ className, ...props }, ref) => (
  <textarea
    className={cn(
      "flex min-h-[96px] w-full rounded-xl px-3.5 py-2.5 text-sm placeholder:text-muted-foreground focus-visible:outline-none",
      fieldControlClasses,
      className
    )}
    ref={ref}
    {...props} />
))
Textarea.displayName = "Textarea"

export { Textarea }
