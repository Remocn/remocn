import Link from "next/link";
import type { ReactNode } from "react";
import { BLOCK_SPACING } from "@/components/docs/blocks/spacing";
import { cn } from "@/lib/utils";
import { getEntry, loadDocsSource } from "../data";

/** Tier artwork (decoration only). */
const ART: Record<"remocn" | "remocn-ui", ReactNode> = {
  remocn: (
    <span className="relative block size-full">
      <span className="absolute top-4 left-4 flex h-[92px] w-[42%] items-center justify-center gap-0.5 rounded-control-sm bg-dark-surface text-[30px] dark:border dark:border-hairline leading-[34px] font-semibold tracking-[-0.04em] text-[#fafafa]">
        Hel
        <span className="translate-y-1.5 opacity-30">lo</span>
      </span>
      <span className="absolute top-4 right-4 left-[calc(42%+26px)] h-[92px] rounded-control-sm bg-[linear-gradient(135deg,#1a1c1e_0%,#3a3d42_45%,#f0abfc_100%)]" />
      <span className="absolute top-[118px] left-4 flex h-[42px] w-16 items-center justify-center rounded-control-sm bg-surface">
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="size-6 fill-none stroke-2 [stroke-linecap:round] [stroke-linejoin:round]"
        >
          <circle cx="12" cy="12" r="9" className="stroke-secondary" />
          <path
            d="M12 3a9 9 0 0 1 9 9a9 9 0 0 1-4 7.5M8 12.5l3 3 5-6"
            className="stroke-foreground"
          />
        </svg>
      </span>
      <span className="absolute top-[118px] left-[90px] h-[42px] w-24 overflow-hidden rounded-control-sm bg-dark-raised dark:border dark:border-hairline">
        <span className="absolute inset-y-0 left-11 w-[60px] bg-[#fafafa]" />
      </span>
      <span className="absolute top-[118px] right-4 left-[196px] flex h-[42px] items-center gap-2 rounded-control-sm bg-surface px-2.5 max-md:hidden">
        <span className="size-[22px] shrink-0 rounded-full bg-secondary" />
        <span className="flex flex-col gap-1">
          <span className="h-[5px] w-[62px] rounded-[3px] bg-foreground" />
          <span className="h-[5px] w-11 rounded-[3px] bg-[#c9cdd0] dark:bg-[#3a3d42]" />
        </span>
      </span>
    </span>
  ),
  "remocn-ui": (
    <span className="relative block size-full text-mono leading-4">
      <span className="absolute top-7 left-4 flex w-[120px] max-md:w-[104px] flex-col gap-1 rounded-control-sm bg-surface p-1 shadow-[0_1px_2px_#0e10120f]">
        <span className="flex h-7 items-center justify-between rounded-tile bg-surface-muted px-2 text-foreground">
          Monthly
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="size-3 fill-none stroke-foreground stroke-[2.4] [stroke-linecap:round] [stroke-linejoin:round]"
          >
            <path d="m5 12.5 4.5 4.5L19 7.5" />
          </svg>
        </span>
        <span className="flex h-7 items-center px-2 text-muted-foreground">
          Yearly
        </span>
      </span>
      <span className="absolute top-[116px] left-4 flex h-9 w-[120px] max-md:w-[104px] items-center justify-center rounded-[10px] bg-secondary text-caption text-foreground">
        Cancel
      </span>
      <span className="absolute top-4 right-4 flex h-36 w-[184px] flex-col gap-2.5 rounded-control bg-surface p-3.5 shadow-[0_1px_2px_#0e10120f,0_8px_24px_#0e10120f]">
        <span className="text-caption font-medium text-foreground">
          Invite your team
        </span>
        <span className="flex h-[30px] items-center gap-0.5 rounded-tile bg-surface-muted px-2.5 text-body">
          ana@studio.dev
          <span className="h-3.5 w-[1.5px] bg-foreground" />
        </span>
        <span className="flex items-center gap-2 text-body">
          <span className="flex size-4 items-center justify-center rounded-[5px] bg-foreground">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="size-2.5 fill-none stroke-inverse stroke-3 [stroke-linecap:round] [stroke-linejoin:round]"
            >
              <path d="m5 12.5 4.5 4.5L19 7.5" />
            </svg>
          </span>
          Send a copy to me
        </span>
        <span className="flex justify-end">
          <span className="flex h-7 items-center rounded-tile bg-foreground px-3 text-inverse">
            Send invite
          </span>
        </span>
      </span>
    </span>
  ),
};

/** The two component tiers side by side (stacked on phones). */
export function Tiers({ children }: { children: ReactNode }) {
  return (
    <div
      data-not-typeset
      className={cn(
        "not-prose grid gap-3 pt-0.5 md:grid-cols-2 md:pt-1",
        BLOCK_SPACING,
      )}
    >
      {children}
    </div>
  );
}

/**
 * One tier card: artwork, name with its registry, an optional description and
 * chips linking to docs pages (labels default to the page titles).
 */
export async function Tier({
  name,
  registry,
  links,
  children,
}: {
  name: string;
  registry: "remocn" | "remocn-ui";
  links: { href: string; label?: string }[];
  children?: ReactNode;
}) {
  await loadDocsSource();
  return (
    <div className="flex min-w-0 flex-col rounded-card border border-hairline bg-surface p-1.5">
      <div
        aria-hidden="true"
        className="h-44 shrink-0 overflow-hidden rounded-control bg-surface-muted"
      >
        {ART[registry]}
      </div>
      <div className="flex flex-col gap-3 px-3.5 pt-3.5 pb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-ui leading-[22px] font-medium text-foreground">
            {name}
          </h3>
          <code className="flex h-6 items-center rounded-[7px] bg-surface-muted px-2 font-mono text-mono leading-4 text-muted-foreground">
            {registry}
          </code>
        </div>
        {children && (
          <div className="text-small leading-[22px] text-body [&_p]:m-0">
            {children}
          </div>
        )}
        <ul
          className={cn(
            "flex flex-wrap",
            registry === "remocn-ui" ? "gap-[5px]" : "gap-1.5",
          )}
        >
          {links.map((link) => {
            const label = link.label ?? getEntry(link.href)?.title;
            if (!label) return null;
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={cn(
                    "flex h-7 items-center rounded-tile bg-surface-muted text-caption leading-4 text-body outline-none transition-colors hover:bg-secondary focus-visible:ring-3 focus-visible:ring-ring",
                    registry === "remocn-ui" ? "px-[9px]" : "px-2.5",
                  )}
                >
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
