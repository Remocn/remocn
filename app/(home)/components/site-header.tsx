"use client";

import { Menu, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { type NavLink } from "@/config/landing";
import { useTrackEvent } from "@/lib/analytics";
import { formatStars } from "@/lib/github";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./theme-toggle";

const GITHUB_URL = "https://github.com/kapishdima/remocn";

const GitHubIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    fill="currentColor"
    role="img"
    aria-label="GitHub"
  >
    <title>GitHub</title>
    <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.27-.01-1-.02-1.96-3.2.69-3.87-1.54-3.87-1.54-.52-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.71 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.47.11-3.06 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.79 0c2.21-1.49 3.18-1.18 3.18-1.18.63 1.59.23 2.77.11 3.06.74.81 1.19 1.84 1.19 3.1 0 4.44-2.7 5.41-5.27 5.7.41.36.78 1.06.78 2.14 0 1.55-.01 2.8-.01 3.18 0 .31.21.68.8.56C20.21 21.39 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5Z" />
  </svg>
);

function GitHubStars({
  stars,
  onClick,
}: {
  stars: number | null;
  onClick?: () => void;
}) {
  return (
    <Link
      href={GITHUB_URL}
      target="_blank"
      rel="noreferrer"
      onClick={onClick}
      className="inline-flex h-9 items-center gap-2 rounded-full border border-border px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
    >
      <GitHubIcon className="size-4" />
      <span className="hidden sm:inline">Star</span>
      {stars !== null && (
        <span className="inline-flex items-center gap-1 tabular-nums text-foreground">
          <Star className="size-3.5 fill-current" />
          {formatStars(stars)}
        </span>
      )}
    </Link>
  );
}

export function SiteHeader({
  navLinks,
  githubStars = null,
  sticky = true,
  fluid = false,
}: {
  navLinks: NavLink[];
  githubStars?: number | null;
  /**
   * Landing variant (default) is sticky and collapses into a floating pill on
   * scroll. Docs passes `sticky={false}` for a static, full-width bar with no
   * scroll listener and no pill morph.
   */
  sticky?: boolean;
  /**
   * Contained (default) keeps the inner bar centered at `max-w-6xl` to match
   * the landing content column. `fluid` drops the max-width so the bar spans
   * the full viewport — used in docs so the logo aligns to the left edge of the
   * full-bleed sidebar instead of floating inward. Intended for the static
   * (`sticky={false}`) docs variant; the sticky pill relies on the contained
   * width, so don't combine `fluid` with the sticky landing variant.
   */
  fluid?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const trackEvent = useTrackEvent();
  const trackGitHubClick = () =>
    trackEvent("cta_clicked", {
      cta: "github_header",
      destination: GITHUB_URL,
    });

  // Collapse the full-width bar into a floating, container-width pill on scroll.
  // Only the sticky (landing) variant listens to scroll; the static docs
  // variant never morphs, so the listener is not attached there.
  useEffect(() => {
    if (!sticky) return;
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [sticky]);

  // `scrolled` can only be true in the sticky variant; guard so the static
  // path never picks up the pill classes even if state lingers.
  const isPill = sticky && scrolled;

  return (
    <header
      className={cn(
        "z-40",
        sticky
          ? cn(
              "sticky inset-x-0 top-0 transition-[background-color,border-color,padding] duration-300",
              isPill
                ? "border-transparent bg-transparent py-3"
                : "border-border bg-background/70 backdrop-blur-xl",
            )
          : "relative h-16 w-full border-b border-border bg-background/70 backdrop-blur-xl",
      )}
    >
      {/* Inner bar matches the page content width (same utilities as SECTION),
          so when scrolled it becomes a floating pill exactly that width.
          In the static docs variant it stays a fixed-height, borderless bar.
          `fluid` drops the max-width/centering so the bar spans the full
          viewport and the logo lands at the sidebar's left edge. */}
      <div
        className={cn(
          "flex w-full items-center justify-between px-4 sm:px-6",
          fluid ? "" : "mx-auto max-w-6xl",
          sticky
            ? cn(
                "border transition-all duration-300",
                isPill
                  ? "h-14 rounded-2xl border-border bg-background/80 shadow-lg shadow-black/5 backdrop-blur-xl dark:shadow-black/30"
                  : "h-16 border-transparent",
              )
            : "h-16",
        )}
      >
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground focus-visible:outline-none"
        >
          <Image
            src="/logo.svg"
            alt="remocn logo"
            width={24}
            height={24}
            priority
            className="rounded-md"
          />
          remocn
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 sm:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline-none"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden sm:block">
            <GitHubStars stars={githubStars} onClick={trackGitHubClick} />
          </div>
          <ThemeToggle />

          {/* Mobile nav trigger */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              render={
                <button
                  type="button"
                  aria-label="Open menu"
                  className="inline-flex size-9 items-center justify-center rounded-full border border-border text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 sm:hidden"
                />
              }
            >
              <Menu className="size-4" aria-hidden="true" />
            </SheetTrigger>
            <SheetContent side="right" className="bg-background">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col px-6 pb-6 text-base">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="py-3 text-foreground/90 transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline-none"
                  >
                    {link.label}
                  </Link>
                ))}
                <div className="mt-4">
                  <GitHubStars
                    stars={githubStars}
                    onClick={() => {
                      setOpen(false);
                      trackGitHubClick();
                    }}
                  />
                </div>
                <Button
                  size="lg"
                  className="mt-4 h-11 w-full rounded-full"
                  render={
                    <Link
                      href="/docs/getting-started/introduction"
                      onClick={() => setOpen(false)}
                    />
                  }
                >
                  Get started
                </Button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
