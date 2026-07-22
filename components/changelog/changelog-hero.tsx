import Link from "next/link";
import { cn } from "@/lib/utils";

const VIEWS = [
  { href: "/changelog", label: "Text" },
  { href: "/changelog/video", label: "Video" },
] as const;

export function ChangelogHero({ active }: { active: "text" | "video" }) {
  const activeHref = active === "text" ? "/changelog" : "/changelog/video";

  return (
    <section className="pt-24 pb-10 sm:pt-28">
      <div className="section">
        <h1 className="text-4xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-5xl">
          Changelog
        </h1>
        <p className="mt-4 max-w-2xl text-balance text-base leading-relaxed text-muted-foreground sm:text-lg">
          New components, transitions, shaders, and icons as they ship.
        </p>

        <nav aria-label="Changelog view" className="mt-8 flex items-center gap-1">
          {VIEWS.map((view) => {
            const isActive = view.href === activeHref;
            return (
              <Link
                key={view.href}
                href={view.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {view.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </section>
  );
}
