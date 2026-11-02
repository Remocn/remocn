import Link from "next/link";
import { cn } from "@/lib/utils";
import { landingButtonVariants } from "../../components/landing/ui/landing-button";
import {
  pageHeaderButton,
  SitePageHeader,
} from "../../components/site-page/page-header";

const VIEWS = [
  { id: "text", href: "/changelog", label: "Text" },
  { id: "video", href: "/changelog/video", label: "Video" },
] as const;

/** Page header shared by `/changelog` and `/changelog/video`. */
export function ChangelogHeader({
  active,
  eyebrow,
  continuation,
}: {
  active: (typeof VIEWS)[number]["id"];
  eyebrow: string;
  continuation: string;
}) {
  return (
    <SitePageHeader
      eyebrow={eyebrow}
      title="Changelog."
      continuation={continuation}
      lead="New components, transitions, shaders, and icons as they ship."
    >
      <nav aria-label="Changelog view" className="flex gap-2.5">
        {VIEWS.map((view) => {
          const isActive = view.id === active;
          return (
            <Link
              key={view.id}
              href={view.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                landingButtonVariants({
                  variant: isActive ? "ink" : "secondary",
                }),
                pageHeaderButton,
                "flex-1 md:flex-none",
              )}
            >
              {view.label}
            </Link>
          );
        })}
      </nav>
    </SitePageHeader>
  );
}
