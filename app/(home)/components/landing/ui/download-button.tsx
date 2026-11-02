import { STUDIO_URL } from "@/config/site";
import { cn } from "@/lib/utils";
import { AppleIcon, LinuxIcon } from "./brand-icons";

/**
 * "Download for free" with the macOS and Linux badges stacked on the left.
 * The badges are concentric with the button: 15px radius minus the 10px
 * inset leaves 5px.
 * `tone="light"` is the white button on dark panels (Studio block),
 * `tone="dark"` the ink one on light surfaces.
 */
export function StudioDownloadButton({
  tone = "light",
  className,
}: {
  tone?: "light" | "dark";
  className?: string;
}) {
  const ring = tone === "light" ? "#FFFFFF" : "#0E1012";
  return (
    <a
      href={STUDIO_URL}
      target="_blank"
      rel="noreferrer"
      data-track="cta_clicked"
      data-cta="studio_download"
      data-destination={STUDIO_URL}
      className={cn(
        "inline-flex h-[52px] shrink-0 items-center gap-3 rounded-[15px] pr-[22px] pl-2.5 text-ui transition-[background-color,transform] duration-150 ease-out outline-none select-none active:translate-y-px focus-visible:ring-3 focus-visible:ring-ring",
        tone === "light"
          ? "bg-white text-[#0e1012] hover:bg-[#f4f4f5]"
          : "bg-foreground text-background hover:bg-foreground/90",
        className,
      )}
    >
      <span className="flex items-center">
        <span
          className="flex size-8 items-center justify-center rounded-[5px] bg-[#0e1012] text-white"
          style={{ boxShadow: `0 0 0 2px ${ring}` }}
        >
          <AppleIcon className="size-[15px]" />
        </span>
        <span
          className="-ml-[9px] flex size-8 items-center justify-center rounded-[5px] bg-[#fde68a] text-[#0e1012]"
          style={{ boxShadow: `0 0 0 2px ${ring}` }}
        >
          <LinuxIcon className="size-[17px]" />
        </span>
      </span>
      Download for free
    </a>
  );
}
