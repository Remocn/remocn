import Link from "next/link";
import { externalLinkProps, FOOTER_LINKS } from "@/config/site";
import { LandingWordmark } from "./landing/header/landing-wordmark";

/**
 * Footer: wordmark + "MIT, built on Remotion" on the left, one flat row of
 * links on the right (`lg`+). Below `lg` it stacks: a hairline on top, the
 * wordmark with the tagline under it, and the links in a two-column grid.
 */
export function SiteFooter() {
  return (
    <footer className="border-t border-border pt-8 pb-[calc(2.5rem+env(safe-area-inset-bottom))] lg:border-t-0 lg:pt-0 lg:pb-14">
      <div
        data-reveal="fade"
        className="landing-container flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between"
      >
        <div className="flex flex-col gap-1.5 lg:flex-row lg:items-center lg:gap-5">
          <Link
            href="/"
            aria-label="remocn home"
            className="flex w-fit rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <LandingWordmark />
          </Link>
          <p className="text-small text-muted-foreground lg:text-mono">
            MIT, built on Remotion
          </p>
        </div>

        <nav
          aria-label="Footer"
          className="grid grid-cols-[150px_150px] gap-x-7 gap-y-3.5 lg:flex lg:gap-7"
        >
          {FOOTER_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              {...externalLinkProps(link, "footer_external")}
              className="relative -mx-2 w-fit rounded-full px-2 py-0 text-[15px] after:absolute after:inset-x-0 after:-inset-y-[7px] lg:after:hidden leading-5 text-body-muted outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring lg:leading-[18px]"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
