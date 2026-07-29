import * as React from "react"

import { cn } from "@/shared/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // Exact computed styles from reference (with light mode fallback)
        "h-9 w-full min-w-0 rounded-2xl border border-border dark:border-[#4d4d4d] bg-background dark:bg-[#0f0f0f] px-3 py-2",
        "text-sm font-medium text-foreground dark:text-[#d4d4d4] outline-none transition-all",
        "placeholder:text-muted-foreground",
        // Focus: primary ring matching brand
        "focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30",
        // File input
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
        // States
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20",
        className
      )}
      {...props}
    />
  )
}

export { Input }
