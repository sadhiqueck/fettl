import { cva } from "class-variance-authority";

export const buttonVariants = cva(
  // Base
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-md text-sm font-medium tracking-[-0.2px] whitespace-nowrap transition-all outline-none select-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:brightness-95",
        secondary: "bg-secondary text-secondary-foreground hover:opacity-90",
        outline: "border border-border bg-card text-foreground hover:bg-muted",
        glassyInverted: "bg-foreground text-background hover:opacity-90",
        ghost: "text-foreground hover:bg-muted",
        destructive: "bg-destructive text-white hover:brightness-90",
        link: "text-foreground underline underline-offset-4",
      },
      size: {
        default: "h-10 px-4 py-2.5",
        xs: "h-7 px-2.5 text-xs [&_svg:not([class*='size-'])]:size-3",
        sm: "h-9 px-3",
        lg: "h-11 px-5 text-base",
        xl: "h-12 px-6 text-base",
        icon: "size-10",
        "icon-xs": "size-7 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-9",
        "icon-lg": "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);
