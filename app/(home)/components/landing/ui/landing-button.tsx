import { cva, type VariantProps } from "class-variance-authority";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Landing buttons. Every button has a fill: ink (primary), secondary grey,
 * light (on dark/shader panels), dark-raised (secondary on dark panels) and
 * fuchsia (the single accent action). Arrows are a separate coloured glyph,
 * passed via `arrow`.
 */
export const landingButtonVariants = cva(
  "inline-flex shrink-0 items-center justify-center whitespace-nowrap font-sans transition-[background-color,box-shadow,transform] duration-150 ease-out outline-none select-none focus-visible:ring-3 focus-visible:ring-ring active:translate-y-px",
  {
    variants: {
      variant: {
        ink: "bg-foreground text-background hover:bg-foreground/90",
        secondary:
          "bg-secondary text-foreground hover:bg-[#dcdde0] dark:hover:bg-[#33363b]",
        light: "bg-[#fafafa] text-[#0e1012] hover:bg-white",
        "dark-raised": "bg-dark-control text-white hover:bg-[#272b2e]",
        fuchsia: "bg-primary text-white hover:bg-primary/90",
      },
      size: {
        lg: "h-[54px] gap-2.5 rounded-cta px-6 text-button-lg",
        md: "h-12 gap-2.5 rounded-control px-5 text-ui",
        nav: "h-[50px] gap-2 rounded-[13px] px-[18px] text-ui",
        studio: "h-[52px] gap-3 rounded-[15px] px-[22px] text-ui",
      },
    },
    defaultVariants: { variant: "ink", size: "lg" },
  },
);

const ARROW_COLOR: Record<
  NonNullable<VariantProps<typeof landingButtonVariants>["variant"]>,
  string
> = {
  ink: "text-primary-soft dark:text-primary",
  secondary: "text-primary",
  light: "text-primary",
  "dark-raised": "text-primary-soft",
  fuchsia: "text-primary-tint",
};

type LandingButtonProps = Omit<ComponentProps<typeof Link>, "children"> &
  VariantProps<typeof landingButtonVariants> & {
    children: ReactNode;
    /** Trailing glyph (usually "→"), tinted per variant. */
    arrow?: ReactNode;
    /** Muted trailing meta, e.g. "10 min". Sits before the arrow. */
    meta?: ReactNode;
  };

export function LandingButton({
  variant = "ink",
  size,
  className,
  children,
  arrow,
  meta,
  ...props
}: LandingButtonProps) {
  return (
    <Link
      className={cn(landingButtonVariants({ variant, size }), className)}
      {...props}
    >
      {children}
      {meta && <span className="text-muted-foreground">{meta}</span>}
      {arrow && (
        <span aria-hidden="true" className={ARROW_COLOR[variant ?? "ink"]}>
          {arrow}
        </span>
      )}
    </Link>
  );
}
