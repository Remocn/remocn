import Link from "next/link";
import type { ReactNode, SVGProps } from "react";
import { landingButtonVariants } from "@/app/(home)/components/landing/ui/landing-button";
import { cn } from "@/lib/utils";

/**
 * Shared atoms for the guide blocks: surfaces, the small guide buttons and
 * the stroke icons the artboards repeat. Every guide block sits outside
 * typeset (`not-prose`) and owns its own top margin.
 */

/** White card with the 1px hairline ring used across the guide artboards. */
export const guideCard = "bg-surface shadow-[0_0_0_1px_var(--color-hairline)]";

/** Always-dark panel (players, prompts): ink in light, code-black + ring in dark. */
export const guidePanel =
  "bg-dark-surface dark:bg-surface-sunken dark:shadow-[0_0_0_1px_var(--color-hairline)]";

/**
 * Grey count after a section heading: `## The storyboard<GuideCount n={8} />`.
 * Fumadocs copies heading children into the TOC, so it hides inside `nav`.
 */
export function GuideCount({ n }: { n: number }) {
  return (
    <span
      className="ml-2.5 font-normal text-subtle in-[nav]:hidden"
      aria-hidden="true"
    >
      {n}
    </span>
  );
}

const guideButtonSize =
  "h-10 gap-2.5 rounded-control-sm px-4 text-small leading-[18px] font-medium";
const guideButtonSizeSm =
  "h-9 gap-2 rounded-control-sm px-3.5 text-small leading-[18px] font-medium";

export function GuideButton({
  href,
  children,
  variant = "secondary",
  size = "sm",
  icon = "right",
  className,
}: {
  href: string;
  children: ReactNode;
  variant?: "ink" | "secondary";
  size?: "sm" | "md";
  icon?: "right" | "down";
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        landingButtonVariants({ variant }),
        size === "md" ? guideButtonSize : guideButtonSizeSm,
        className,
      )}
    >
      {children}
      {icon === "down" ? (
        <ArrowDownIcon
          className={
            variant === "ink"
              ? "text-primary-soft dark:text-primary"
              : undefined
          }
        />
      ) : (
        <ArrowRightIcon
          className={
            variant === "ink"
              ? "text-primary-soft dark:text-primary"
              : undefined
          }
        />
      )}
    </Link>
  );
}

function Icon({
  children,
  size = 14,
  strokeWidth = 2,
  className,
  ...props
}: SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cn("shrink-0", className)}
      {...props}
    >
      {children}
    </svg>
  );
}

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

export function ArrowRightIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </Icon>
  );
}

export function ArrowDownIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 5v14M6 13l6 6 6-6" />
    </Icon>
  );
}

export function CopyIcon(props: IconProps) {
  return (
    <Icon strokeWidth={1.8} {...props}>
      <rect x="8" y="8" width="12" height="12" rx="2.5" />
      <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
    </Icon>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <Icon strokeWidth={2.6} {...props}>
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </Icon>
  );
}

export function PlayIcon({ size = 14, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={cn("shrink-0", className)}
    >
      <path d="M6 3.5v17l14.5-8.5Z" fill="currentColor" />
    </svg>
  );
}

export function PauseIcon({ size = 14, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={cn("shrink-0", className)}
    >
      <rect x="6" y="4" width="4" height="16" rx="1" fill="currentColor" />
      <rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor" />
    </svg>
  );
}

export function FilmIcon(props: IconProps) {
  return (
    <Icon strokeWidth={1.8} {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="M8 5v14M16 5v14" />
    </Icon>
  );
}

export function ImageIcon(props: IconProps) {
  return (
    <Icon strokeWidth={1.8} {...props}>
      <path d="M4 16l4.5-4.5a2 2 0 0 1 2.8 0L16 16M14 14l1.5-1.5a2 2 0 0 1 2.8 0L20 14" />
      <rect x="3" y="4" width="18" height="16" rx="3" />
      <circle cx="9" cy="8.5" r="1.5" fill="currentColor" stroke="none" />
    </Icon>
  );
}

export function DownloadIcon(props: IconProps) {
  return (
    <Icon strokeWidth={1.8} {...props}>
      <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />
    </Icon>
  );
}

export function FlagIcon(props: IconProps) {
  return (
    <Icon strokeWidth={2.2} {...props}>
      <path d="M5 21V4M5 4h11l-2 4 2 4H5" />
    </Icon>
  );
}

export function LockIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="5" y="10" width="14" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </Icon>
  );
}

export function ShieldIcon(props: IconProps) {
  return (
    <Icon strokeWidth={1.8} {...props}>
      <path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6Z" />
      <path d="m9 12 2 2 4-4" />
    </Icon>
  );
}
