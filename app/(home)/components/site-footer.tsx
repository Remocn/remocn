import Link from "next/link";
import { type NavLink, SECTION } from "@/config/landing";

export function SiteFooter({
  navLinks,
  className = "",
}: {
  navLinks: NavLink[];
  className?: string;
}) {
  return (
    <div className={`${SECTION} ${className}`}>
      <footer className="flex flex-col items-start justify-between gap-4 border-t border-border pt-8 pb-12 text-sm text-muted-foreground md:flex-row md:items-center">
        <span suppressHydrationWarning>
          © {new Date().getFullYear()} remocn — MIT licensed
        </span>
        <nav className="flex gap-6">
          {navLinks.map((link) => {
            const external = link.href.startsWith("http");
            const className =
              "transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline-none";
            return external ? (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className={className}
              >
                {link.label}
              </a>
            ) : (
              <Link key={link.href} href={link.href} className={className}>
                {link.label}
              </Link>
            );
          })}
        </nav>
      </footer>
    </div>
  );
}
