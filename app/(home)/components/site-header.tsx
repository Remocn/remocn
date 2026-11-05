import Link from "next/link";
import type { ReactNode } from "react";
import { DOCS_MENU_HREF } from "@/config/docs-directory";
import { NAV_LINKS } from "@/config/site";
import { HEADER_LAYOUT, headerLayoutVars } from "@/lib/header-layout";
import { cn } from "@/lib/utils";
import { DocsDirectory } from "./landing/header/docs-directory";
import { GitHubStarsLink } from "./landing/header/github-stars-link";
import {
  LandingMenu,
  LandingMenuPanel,
  LandingNav,
} from "./landing/header/landing-nav";
import { LandingWordmark } from "./landing/header/landing-wordmark";
import { MobileMenu } from "./landing/header/mobile-menu";
import { HeaderPill } from "./landing/header/pill-track";
import { RegistryHealthBadge } from "./landing/header/registry-health-badge";
import { landingButtonVariants } from "./landing/ui/landing-button";

const GET_STARTED_HREF = "/docs/getting-started/introduction";

const CAPSULE = "flex items-center bg-capsule";

/**
 * Site header: two capsules in normal flow (no fixed/scroll behaviour, no
 * background of its own — the page behind it shows through). Desktop (`xl`):
 * logo + nav capsule and GitHub / health / Get started capsule, 28px + 64px.
 * `lg`: the right capsule keeps only Get started. Below `lg`: logo capsule,
 * Get started and a menu button that opens the full-screen sheet. Desktop
 * sizes come from `config/header-layout.json` (tuned in `/lab/header-layout`).
 */
export function SiteHeader({
  mobileAction,
}: {
  /** Replaces Get started below `lg` (the docs put search there). */
  mobileAction?: ReactNode;
} = {}) {
  return (
    <header
      data-site-header
      className="relative z-40 overflow-x-clip"
      style={headerLayoutVars(HEADER_LAYOUT)}
    >
      <LandingMenu className="group/header relative mx-auto flex w-full max-w-(--docs-frame) items-center justify-between gap-4 px-4 xl:gap-2 py-3 md:px-10 lg:pt-(--hdr-top) lg:pb-0 xl:px-(--docs-gutter)">
        <HeaderPill />
        <div
          className={cn(
            CAPSULE,
            "h-11 rounded-control px-3.5 lg:h-(--hdr-h) lg:gap-[23px] lg:rounded-(--hdr-r) lg:pr-[calc(var(--hdr-inset)+8px)] lg:pl-[calc(var(--hdr-inset)+15px)]",
          )}
        >
          <Link
            href="/"
            aria-label="Remocn home"
            className="flex rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <LandingWordmark />
          </Link>
          <LandingNav links={NAV_LINKS} className="max-lg:hidden" />
        </div>

        <div
          data-header-island
          className={cn(
            "flex items-center gap-2 lg:h-(--hdr-h) lg:gap-1.5 lg:rounded-(--hdr-r) lg:bg-capsule lg:p-[calc(var(--hdr-inset)-1px)]",
          )}
        >
          <div className="flex items-center max-xl:hidden">
            <GitHubStarsLink
              pill="right"
              className="relative h-(--hdr-item-h) rounded-(--hdr-item-r) px-[calc(var(--hdr-pad)+1px)] focus-visible:ring-primary"
            />
            <span
              aria-hidden="true"
              className="mx-[3px] h-5 w-px bg-border transition-opacity duration-150 group-data-[pill-zone=right]/header:opacity-0"
            />
            <RegistryHealthBadge />
          </div>
          <Link
            href={GET_STARTED_HREF}
            data-track="cta_clicked"
            data-cta="get_started_header"
            data-destination={GET_STARTED_HREF}
            data-pill="behind"
            className={cn(
              landingButtonVariants({ variant: "ink", size: "nav" }),
              mobileAction && "max-lg:hidden",
              "relative h-11 rounded-control px-4 text-[15px] leading-[18px] font-medium lg:h-(--hdr-item-h) lg:rounded-(--hdr-item-r) lg:px-[calc(var(--hdr-pad)+5px)] lg:text-ui lg:font-normal",
            )}
          >
            Get started
          </Link>
          {mobileAction && <div className="lg:hidden">{mobileAction}</div>}
          <div className="lg:hidden">
            <MobileMenu />
          </div>
        </div>
        <LandingMenuPanel href={DOCS_MENU_HREF}>
          <DocsDirectory />
        </LandingMenuPanel>
      </LandingMenu>
    </header>
  );
}
