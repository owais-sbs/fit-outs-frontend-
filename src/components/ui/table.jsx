import * as React from "react"

import { cn } from "@/lib/utils"
import { useDensityOptional } from "@/lib/density"

const Table = React.forwardRef(
  (
    {
      className,
      stickyHeader = false,
      density: densityProp,
      framed = false,
      ...props
    },
    ref
  ) => {
    const densityCtx = useDensityOptional()
    const density = densityProp ?? densityCtx?.density ?? "comfortable"

    return (
      <div
        className={cn(
          "relative w-full overflow-auto",
          framed && "rounded-xl border border-border bg-card"
        )}
      >
        <table
          ref={ref}
          data-density={density}
          className={cn(
            "w-full caption-bottom text-sm",
            stickyHeader && "[&_thead]:sticky [&_thead]:top-0 [&_thead]:z-10",
            density === "compact" && "[&_th]:h-9 [&_td]:py-1.5",
            className
          )}
          {...props}
        />
      </div>
    )
  }
)
Table.displayName = "Table"

const TableHeader = React.forwardRef(({ className, ...props }, ref) => (
  <thead
    ref={ref}
    className={cn("[&_tr]:border-b [&_tr]:border-border/50", className)}
    {...props}
  />
))
TableHeader.displayName = "TableHeader"

const TableBody = React.forwardRef(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child]:border-0", className)}
    {...props}
  />
))
TableBody.displayName = "TableBody"

const TableFooter = React.forwardRef(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      "border-t border-border/50 font-medium [&>tr]:last:border-b-0",
      className
    )}
    {...props}
  />
))
TableFooter.displayName = "TableFooter"

const TableRow = React.forwardRef(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "border-b border-border/40 transition-colors hover:bg-secondary/40 data-[state=selected]:bg-accent/50",
      className
    )}
    {...props}
  />
))
TableRow.displayName = "TableRow"

const TableHead = React.forwardRef(({ className, numeric, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-11 px-3 text-left align-middle text-xs font-medium tracking-wide text-muted-foreground bg-muted/40 [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
      numeric && "text-right",
      className
    )}
    {...props}
  />
))
TableHead.displayName = "TableHead"

const TableCell = React.forwardRef(({ className, numeric, ...props }, ref) => (
  <td
    ref={ref}
    className={cn(
      "px-3 py-3 align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
      numeric && "text-right tabular-nums",
      className
    )}
    {...props}
  />
))
TableCell.displayName = "TableCell"

const TableCaption = React.forwardRef(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn("mt-4 text-sm text-muted-foreground", className)}
    {...props}
  />
))
TableCaption.displayName = "TableCaption"

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
