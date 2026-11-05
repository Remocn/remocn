import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatDuration } from "@/lib/video-duration";
import { GitHubLogoIcon } from "../../../components/landing/ui/brand-icons";
import { CopyTextButton } from "../../../components/site-page/copy-text-button";
import { installCommand, type ReelClip } from "../../lib/reel-types";

const BUTTON =
  "inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-control px-2 text-[15px] leading-5 whitespace-nowrap xl:px-[18px] outline-none transition-[background-color,box-shadow,translate] duration-150 ease-out focus-visible:ring-3 focus-visible:ring-white/40 active:translate-y-px max-xl:flex-1";

/**
 * Details of the clip under the playhead: where it sits on the reel, who
 * made it, the components it was built with and how to install them.
 */
export function Inspector({
  clip,
  number,
  count,
}: {
  clip: ReelClip;
  number: string;
  count: number;
}) {
  const command = installCommand(clip);

  return (
    <div className="flex min-w-0 grow flex-col justify-between gap-5 px-1.5 pt-1.5 pb-2 xl:gap-6 xl:px-1 xl:pt-2 xl:pb-1">
      <div className="flex flex-col gap-2.5 xl:gap-3.5">
        <p className="text-caption text-dark-subtle tabular-nums">
          {number} of {count}, {formatDuration(clip.start)} to{" "}
          {formatDuration(clip.start + clip.duration)}
        </p>
        <h2 className="text-[28px] leading-8 tracking-heading text-[#fafafa] text-balance xl:text-[36px] xl:leading-10">
          {clip.title}
        </h2>
        <p className="flex items-center gap-2.5">
          {/* biome-ignore lint/performance/noImgElement: remote showcase avatars of arbitrary origin */}
          <img
            src={clip.author.avatarUrl}
            alt=""
            width={24}
            height={24}
            loading="lazy"
            referrerPolicy="no-referrer"
            className="size-6 shrink-0 rounded-full bg-dark-raised object-cover"
          />
          {clip.author.url ? (
            <a
              href={clip.author.url}
              target="_blank"
              rel="noreferrer"
              className="-mx-1 rounded-tag px-1 text-small text-dark-body outline-none transition-colors hover:bg-white/8 hover:text-white focus-visible:ring-2 focus-visible:ring-white/40"
            >
              {clip.author.name}
            </a>
          ) : (
            <span className="text-small text-dark-body">
              {clip.author.name}
            </span>
          )}
          <time dateTime={clip.iso} className="text-caption text-dark-subtle">
            {clip.dateLabel}
          </time>
        </p>
      </div>

      <div className="flex flex-col gap-2.5">
        {clip.components.length > 0 && (
          <>
            <p className="text-caption text-dark-subtle">Built with</p>
            <ul className="flex flex-wrap gap-2">
              {clip.components.map((component) => (
                <li key={`${component.name}-${component.href}`}>
                  <Link
                    href={component.href}
                    className={cn(
                      "relative flex h-9 items-center rounded-control-sm bg-dark-raised px-3 text-[#fafafa] outline-none transition-colors hover:bg-[#25282b] after:absolute after:inset-x-0 after:-inset-y-1 focus-visible:ring-2 focus-visible:ring-white/40",
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
          </>
        )}
        {command && (
          <div className="flex h-12 items-center gap-2 rounded-control bg-dark-raised pr-1.5 pl-3.5 xl:pl-4">
            <code className="min-w-0 grow truncate font-mono text-mono text-[#fafafa] xl:text-caption">
              {command}
            </code>
            <CopyTextButton
              text={command}
              installComponent={clip.components[0]?.registryName ?? undefined}
              aria-label="Copy install command"
              className="relative flex h-9 shrink-0 items-center rounded-[10px] bg-[#2a2e31] px-3 text-small text-[#fafafa] outline-none transition-colors after:absolute after:inset-x-0 after:-inset-y-1 hover:bg-[#33373a] focus-visible:ring-2 focus-visible:ring-white/40"
            >
              Copy
            </CopyTextButton>
          </div>
        )}
        <div className="flex gap-2 pt-1.5 xl:gap-2.5 xl:pt-2.5">
          <Link
            href={`/showcases/${clip.slug}`}
            className={cn(BUTTON, "bg-white text-[#0e1012] hover:bg-[#ececee]")}
          >
            Open showcase
            <span aria-hidden="true" className="text-primary">
              →
            </span>
          </Link>
          {clip.githubUrl && (
            <a
              href={clip.githubUrl}
              target="_blank"
              rel="noreferrer"
              className={cn(
                BUTTON,
                "bg-[#25282b] text-[#fafafa] hover:bg-[#2e3236]",
              )}
            >
              <GitHubLogoIcon className="size-4" />
              View source
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
