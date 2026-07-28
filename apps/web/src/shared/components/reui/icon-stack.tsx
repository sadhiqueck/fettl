import * as React from "react"
import { cn } from "@/shared/lib/utils"

interface IconStackProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export function IconStack({ className, children, ...props }: IconStackProps) {
  return (
    <div
      className={cn(
        "relative flex items-center justify-center rounded-xl border border-border bg-card shadow-sm transition-all duration-200",
        className
      )}
      {...props}
    >
      <div className="absolute inset-0 -z-10 translate-x-[4px] translate-y-[4px] rounded-xl border border-border bg-muted/50" />
      <div className="absolute inset-0 -z-20 translate-x-[8px] translate-y-[8px] rounded-xl border border-border bg-muted/20" />
      {children}
    </div>
  )
}
