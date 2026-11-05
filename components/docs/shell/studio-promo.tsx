import {
  AppleIcon,
  LinuxIcon,
} from "@/app/(home)/components/landing/ui/brand-icons";
import { StudioAppIcon } from "@/app/(home)/components/landing/ui/remocn-mark";
import { STUDIO_URL } from "@/config/site";
import { cn } from "@/lib/utils";

/** Tiny Studio window: chat column on the left, the dark stage on the right. */
function MiniWindow({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "flex shrink-0 flex-col gap-1.5 rounded-[10px] bg-surface-muted p-2",
        className,
      )}
    >
      <div className="flex gap-1">
        {[0, 1, 2].map((dot) => (
          <span key={dot} className="size-1.5 rounded-full bg-divider" />
        ))}
      </div>
      <div className="flex flex-1 gap-1.5 max-xl:flex-col">
        <div className="flex w-16 shrink-0 flex-col gap-1 pt-0.5">
          <span className="h-3 w-14 rounded-[4px] bg-surface dark:bg-secondary" />
          <span className="h-3 w-[42px] rounded-[4px] bg-primary-tint" />
          <span className="h-3 w-[50px] rounded-[4px] bg-surface max-xl:hidden dark:bg-secondary" />
        </div>
        <div className="flex flex-1 flex-col justify-between rounded-tag bg-dark-surface p-1.5">
          <div className="flex flex-1 items-center justify-center">
            <span className="rounded-[3px] border border-[#F0ABFC] px-1 py-0.5">
              <span className="block h-[5px] w-9 rounded-[2px] bg-[#F5F5F5]" />
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="size-1.5 rounded-[2px] bg-white" />
            <span className="h-[3px] flex-1 rounded-[2px] bg-white/14" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Compact "Download for free" for the rail: ink on light, near-white on dark,
 * with the macOS / Linux badges ringed in the button colour. Badge corners
 * follow the button's: 12px minus the inset (8px below `xl`, 5px from it).
 */
function DownloadButton() {
  const badge =
    "flex size-[26px] items-center justify-center rounded-[4px] shadow-[0_0_0_1.5px_#0E1012] xl:rounded-[7px] dark:shadow-[0_0_0_1.5px_#F4F4F5]";
  return (
    <a
      href={STUDIO_URL}
      target="_blank"
      rel="noreferrer"
      data-track="cta_clicked"
      data-cta="studio_download_docs"
      data-destination={STUDIO_URL}
      className="mt-1 flex h-11 w-fit shrink-0 items-center gap-[9px] rounded-control-sm bg-[#0E1012] pr-3.5 pl-2 text-caption text-white outline-none transition-colors hover:bg-[#0E1012]/90 focus-visible:ring-2 focus-visible:ring-ring xl:mt-0 xl:h-9 xl:pl-[5px] dark:bg-[#F4F4F5] dark:text-[#0E1012] dark:hover:bg-white"
    >
      <span className="relative flex h-[26px] w-[45px] shrink-0">
        <span className={cn(badge, "absolute left-0 bg-white text-[#0E1012]")}>
          <AppleIcon className="size-3" />
        </span>
        <span
          className={cn(
            badge,
            "absolute left-[19px] bg-[#FDE68A] text-[#0E1012]",
          )}
        >
          <LinuxIcon className="size-3.5" />
        </span>
      </span>
      Download for free
    </a>
  );
}

/**
 * Remocn Studio card. Rail (desktop): window on top, copy below. Under the
 * article on smaller screens it turns into a row.
 */
export function StudioPromo({ className }: { className?: string }) {
  return (
    <aside
      aria-label="Remocn Studio"
      className={cn(
        "flex gap-3.5 rounded-capsule border border-hairline bg-surface p-2 xl:flex-col xl:gap-2.5",
        className,
      )}
    >
      <MiniWindow className="w-28 xl:h-24 xl:w-auto" />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5 pt-1 pr-1 pb-0.5 xl:px-1.5 xl:pt-0 xl:pb-0">
        <p className="flex items-center gap-2 text-small leading-[18px] font-medium text-foreground">
          <StudioAppIcon size={20} radius={5} markSize={12} />
          Remocn Studio
        </p>
        <p className="text-caption leading-[19px] text-muted-foreground">
          Describe a video in chat, click the thing that looks wrong, and export
          an mp4 without touching a terminal.
        </p>
        <DownloadButton />
      </div>
    </aside>
  );
}
