import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import {
  externalLinkProps,
  FOOTER_GROUPS,
  GITHUB_URL,
  SUPPORT_EMAIL,
  THREADS_URL,
  X_URL,
} from "@/config/site";
import { cn } from "@/lib/utils";
import { GitHubIcon } from "./github-icon";
import { HeaderLogo } from "./header-parts";
import { ThreadsIcon } from "./threads-icon";
import { XIcon } from "./x-icon";

const SOCIALS = [
  { href: GITHUB_URL, label: "GitHub", Icon: GitHubIcon },
  { href: X_URL, label: "X", Icon: XIcon },
  { href: THREADS_URL, label: "Threads", Icon: ThreadsIcon },
];

const LINK_CLASS =
  "w-fit text-muted-foreground transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline-none";

export function SiteFooter() {
  return (
    <div className="section">
      <footer className="border-t border-border pt-10 pb-[calc(3rem+env(safe-area-inset-bottom))] text-sm">
        <div className="flex flex-col gap-10 md:flex-row md:justify-between">
          <div className="flex flex-col items-start gap-4 md:max-w-64">
            <HeaderLogo />
            <p className="text-muted-foreground">
              Describe your product, get a demo video.
            </p>
            <div className="flex items-center gap-3">
              {SOCIALS.map(({ href, label, Icon }) => (
                <a
                  key={href}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="rounded-full p-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline-none"
                >
                  <Icon className="size-4" />
                </a>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:gap-16">
            {FOOTER_GROUPS.map((group) => (
              <nav key={group.label} className="flex flex-col gap-3">
                <span className="font-medium text-foreground">
                  {group.label}
                </span>
                {group.links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    {...externalLinkProps(link, "footer_external")}
                    className={cn(
                      LINK_CLASS,
                      link.external && "inline-flex items-center gap-0.5",
                    )}
                  >
                    {link.label}
                    {link.external && (
                      <ArrowUpRight className="size-3.5" aria-hidden="true" />
                    )}
                  </Link>
                ))}
              </nav>
            ))}
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-1 border-t border-border pt-6 text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span suppressHydrationWarning>
            © {new Date().getFullYear()} remocn — MIT licensed
          </span>
          <a href={`mailto:${SUPPORT_EMAIL}`} className={LINK_CLASS}>
            {SUPPORT_EMAIL}
          </a>
        </div>
      </footer>
    </div>
  );
}
