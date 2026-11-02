import Link from "next/link";
import { cn } from "@/lib/utils";
import { GitHubLogoIcon } from "../../components/landing/ui/brand-icons";
import { landingButtonVariants } from "../../components/landing/ui/landing-button";
import { CopyTextButton } from "../../components/site-page/copy-text-button";
import { pageHeaderButton } from "../../components/site-page/page-header";
import { installCommand, type ReelClip } from "../lib/reel-types";

/** Side card of a showcase page: components, install command, source. */
export function ShowcaseDetails({ clip }: { clip: ReelClip }) {
  const command = installCommand(clip);

  return (
    <aside className="flex flex-col gap-5 rounded-card bg-surface-muted p-5 md:p-6 xl:w-[396px] xl:shrink-0 xl:self-start">
      {clip.components.length > 0 && (
        <div className="flex flex-col gap-2.5">
          <p className="text-caption text-muted-foreground">Built with</p>
          <ul className="flex flex-wrap gap-2">
            {clip.components.map((component) => (
              <li key={`${component.name}-${component.href}`}>
                <Link
                  href={component.href}
                  className={cn(
                    "relative flex h-8 items-center rounded-tile bg-surface px-2.5 text-foreground shadow-[0_0_0_1px_var(--hairline)] outline-none transition-colors after:absolute after:inset-x-0 after:-inset-y-1 hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring",
                    component.registryName
                      ? "font-mono text-mono"
                      : "text-caption",
                  )}
                >
                  {component.registryName ?? component.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {command && (
        <div className="flex h-12 items-center gap-2 rounded-control bg-surface pr-1.5 pl-4 shadow-[0_0_0_1px_var(--hairline)]">
          <code className="min-w-0 grow truncate font-mono text-mono text-foreground">
            {command}
          </code>
          <CopyTextButton
            text={command}
            installComponent={clip.components[0]?.registryName ?? undefined}
            aria-label="Copy install command"
            className={cn(
              landingButtonVariants({ variant: "secondary" }),
              "relative h-9 rounded-[10px] px-3 text-small after:absolute after:inset-x-0 after:-inset-y-1",
            )}
          >
            Copy
          </CopyTextButton>
        </div>
      )}

      {clip.githubUrl && (
        <a
          href={clip.githubUrl}
          target="_blank"
          rel="noreferrer"
          className={cn(
            landingButtonVariants({ variant: "ink" }),
            pageHeaderButton,
            "self-start",
          )}
        >
          <GitHubLogoIcon className="size-4" />
          View source
        </a>
      )}
    </aside>
  );
}
