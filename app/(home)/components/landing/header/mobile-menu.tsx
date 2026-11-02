import Link from "next/link";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { NAV_LINKS, X_URL } from "@/config/site";
import { cn } from "@/lib/utils";
import { NavBadge } from "../../header-nav";
import { XLogoIcon } from "../ui/brand-icons";
import { landingButtonVariants } from "../ui/landing-button";
import { GitHubStarsLink } from "./github-stars-link";
import { LandingWordmark } from "./landing-wordmark";

const ICON_BUTTON =
  "flex size-11 shrink-0 items-center justify-center rounded-control bg-capsule text-foreground outline-none transition-colors hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring";

const GET_STARTED_HREF = "/docs/getting-started/introduction";

/**
 * Mobile menu (below `lg`): a hamburger capsule that opens a full-screen sheet
 * with the logo/close row, the big link list and the GitHub / X / Get started
 * actions pinned to the bottom.
 */
export function MobileMenu() {
  return (
    <Sheet>
      <SheetTrigger className={ICON_BUTTON} aria-label="Open menu">
        <svg viewBox="0 0 24 24" aria-hidden="true" className="size-[18px]">
          <path
            d="M4 8h16M4 16h16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </SheetTrigger>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="border-0 bg-background shadow-none data-[side=right]:w-full data-[side=right]:border-l-0 data-[side=right]:sm:max-w-none"
      >
        <SheetTitle className="sr-only">Menu</SheetTitle>
        <div className="flex items-center justify-between px-4 py-3 md:px-10">
          <SheetClose
            nativeButton={false}
            render={
              <Link
                href="/"
                aria-label="remocn home"
                className="flex h-11 items-center rounded-control bg-capsule px-3.5 outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            }
          >
            <LandingWordmark />
          </SheetClose>
          <SheetClose className={ICON_BUTTON} aria-label="Close menu">
            <svg viewBox="0 0 24 24" aria-hidden="true" className="size-[18px]">
              <path
                d="M6 6l12 12M18 6 6 18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </SheetClose>
        </div>

        <div className="flex flex-1 flex-col justify-between overflow-y-auto px-5 pt-4 pb-7 md:px-10">
          <nav aria-label="Main" className="flex flex-col">
            {NAV_LINKS.map((link) => (
              <SheetClose
                key={link.href}
                nativeButton={false}
                render={
                  <Link
                    href={link.href}
                    target={link.external ? "_blank" : undefined}
                    rel={link.external ? "noreferrer" : undefined}
                    className="flex h-14 shrink-0 items-center gap-2.5 border-b border-border text-[26px] leading-[30px] tracking-[-0.03em] text-foreground outline-none focus-visible:bg-muted"
                  />
                }
              >
                {link.label}
                {link.badge && (
                  <NavBadge className="px-[7px] text-mono">
                    {link.badge}
                  </NavBadge>
                )}
              </SheetClose>
            ))}
          </nav>

          <div className="mt-8 flex flex-col gap-2.5">
            <div className="flex gap-2.5">
              <GitHubStarsLink
                iconClassName="size-4"
                className="h-[52px] flex-1 justify-center rounded-cta bg-secondary text-foreground hover:bg-[#dcdde0] dark:hover:bg-[#33363b]"
              />
              <a
                href={X_URL}
                target="_blank"
                rel="noreferrer"
                aria-label="remocn on X"
                className="flex size-[52px] shrink-0 items-center justify-center rounded-cta bg-secondary text-foreground outline-none transition-colors hover:bg-[#dcdde0] focus-visible:ring-2 focus-visible:ring-ring dark:hover:bg-[#33363b]"
              >
                <XLogoIcon className="size-4" />
              </a>
            </div>
            <SheetClose
              nativeButton={false}
              render={
                <Link
                  href={GET_STARTED_HREF}
                  className={cn(
                    landingButtonVariants({ variant: "ink" }),
                    "h-14 w-full gap-2 text-[17px] leading-5 font-medium",
                  )}
                />
              }
            >
              Get started
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="size-4 text-primary-soft dark:text-primary"
              >
                <path
                  d="M5 12h14M13 6l6 6-6 6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </SheetClose>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
