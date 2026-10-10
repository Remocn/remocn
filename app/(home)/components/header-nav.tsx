"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { SlidingHighlight } from "@/components/sliding-highlight";
import { SheetClose } from "@/components/ui/sheet";
import { MEGA_MENU_SECTIONS } from "@/config/mega-menu";
import type { NavLink } from "@/config/site";
import { cn } from "@/lib/utils";
import { MegaMenuPanel } from "./mega-menu";

const SECTION_HREFS = new Set(MEGA_MENU_SECTIONS.map((s) => s.href));

// The mega panel is desktop-only: below `lg` it is display:none, and on touch
// devices hover-open fights with tap-to-navigate. Checked at interaction time
// so no resize listener or hydration mismatch is needed.
const canOpenMenu = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(min-width: 64rem) and (hover: hover)").matches;

/**
 * Desktop nav whose items behave like ghost buttons: a single rounded
 * background tracks the hovered (or keyboard-focused) item and springs from one
 * to the next instead of popping. Rendered once and animated via transform, so
 * moving between items reads as the same pill sliding across the row. Hidden
 * below `sm`, where the header falls back to the mobile sheet.
 *
 * Registry links (Components / Shaders / Icons) additionally open a shared
 * mega-menu panel: a short intent delay on open, a grace delay on close so the
 * pointer can travel into the panel, and instant section switching while the
 * panel is already open (the panel slides its content instead of reopening).
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
  const [open, setOpen] = useState<string | null>(null);
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = () => {
    if (openTimer.current) clearTimeout(openTimer.current);
    if (closeTimer.current) clearTimeout(closeTimer.current);
    openTimer.current = null;
    closeTimer.current = null;
  };

  useEffect(
    () => () => {
      if (openTimer.current) clearTimeout(openTimer.current);
      if (closeTimer.current) clearTimeout(closeTimer.current);
    },
    [],
  );

  const scheduleOpen = (href: string) => {
    if (!canOpenMenu()) return;
    clearTimers();
    if (open) {
      setOpen(href);
    } else {
      openTimer.current = setTimeout(() => setOpen(href), 50);
    }
  };

  const scheduleClose = (delay = 120) => {
    clearTimers();
    closeTimer.current = setTimeout(() => setOpen(null), delay);
  };

  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = null;
  };

  const closeNow = () => {
    clearTimers();
    setOpen(null);
  };

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
      onMouseEnter={cancelClose}
      onMouseLeave={() => {
        setHighlight(null);
        scheduleClose();
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") closeNow();
      }}
      // Retract the pill once focus leaves the nav entirely (not while tabbing
      // between items), mirroring the mouse-leave behaviour for keyboard users.
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setHighlight(null);
          closeNow();
        }
      }}
      className={cn("relative hidden items-center gap-1 sm:flex", className)}
    >
      <SlidingHighlight rect={highlight} />
      {links.map((link) => {
        const hasMenu = SECTION_HREFS.has(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            onMouseEnter={(event) => {
              moveTo(event.currentTarget);
              if (hasMenu) {
                scheduleOpen(link.href);
              } else {
                scheduleClose(100);
              }
            }}
            onFocus={(event) => {
              moveTo(event.currentTarget);
              if (hasMenu && canOpenMenu()) {
                clearTimers();
                setOpen(link.href);
              }
            }}
            onClick={closeNow}
            aria-haspopup={hasMenu ? "true" : undefined}
            aria-expanded={hasMenu ? open === link.href : undefined}
            aria-controls={hasMenu ? "site-mega-menu" : undefined}
            className="relative rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline-none"
          >
            {link.label}
          </Link>
        );
      })}
      <MegaMenuPanel open={open} onNavigate={closeNow} />
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
              aria-label={link.label}
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
