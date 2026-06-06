"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { SlidingHighlight } from "@/components/sliding-highlight";
import { SheetClose } from "@/components/ui/sheet";
import type { NavLink } from "@/config/site";
import { cn } from "@/lib/utils";

/**
 * Desktop nav whose items behave like ghost buttons: a single rounded
 * background tracks the hovered (or keyboard-focused) item and springs from one
 * to the next instead of popping. Rendered once and animated via transform, so
 * moving between items reads as the same pill sliding across the row. Hidden
 * below `sm`, where the header falls back to the mobile sheet.
 */
export function NavDesktop({
  links,
  className,
}: {
  links: NavLink[];
  className?: string;
}) {
  const navRef = useRef<HTMLElement>(null);
  const [highlight, setHighlight] = useState<{
    left: number;
    width: number;
  } | null>(null);

  // Measure the item relative to the nav so the pill can be positioned with a
  // transform (left:0 + translateX) rather than animating layout.
  const moveTo = (el: HTMLElement | null) => {
    const nav = navRef.current;
    if (!nav || !el) return;
    const navRect = nav.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    setHighlight({ left: elRect.left - navRect.left, width: elRect.width });
  };

  return (
    <nav
      ref={navRef}
      onMouseLeave={() => setHighlight(null)}
      // Retract the pill once focus leaves the nav entirely (not while tabbing
      // between items), mirroring the mouse-leave behaviour for keyboard users.
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setHighlight(null);
        }
      }}
      className={cn("relative hidden items-center gap-1 sm:flex", className)}
    >
      <SlidingHighlight rect={highlight} />
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          onMouseEnter={(event) => moveTo(event.currentTarget)}
          onFocus={(event) => moveTo(event.currentTarget)}
          className="relative rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline-none"
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}

/**
 * Mobile nav: just the stacked list of links rendered inside the header's
 * Sheet. The Sheet shell, GitHub stars, and the Get-started CTA stay with the
 * header; each link is a `SheetClose` so a tap closes the sheet before routing.
 */
export function NavMobile({ links }: { links: NavLink[] }) {
  return (
    <nav className="flex flex-col px-6 text-base">
      {links.map((link) => (
        <SheetClose
          key={link.href}
          render={
            <Link
              href={link.href}
              className="py-3 text-foreground/90 transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline-none"
            />
          }
        >
          {link.label}
        </SheetClose>
      ))}
    </nav>
  );
}

/**
 * Footer nav: a flat row of links. External (`http`) targets open in a new tab
 * via a plain anchor; internal targets use the client router.
 */
export function NavFooter({
  links,
  className,
}: {
  links: NavLink[];
  className?: string;
}) {
  return (
    <nav className={cn("flex gap-6", className)}>
      {links.map((link) => {
        const external = link.href.startsWith("http");
        const linkClassName =
          "transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline-none";
        return external ? (
          <a
            key={link.href}
            href={link.href}
            target="_blank"
            rel="noreferrer"
            className={linkClassName}
          >
            {link.label}
          </a>
        ) : (
          <Link key={link.href} href={link.href} className={linkClassName}>
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
