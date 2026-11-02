import Link from "next/link";
import { cn } from "@/lib/utils";
import { BentoClip } from "./bento-clip";

/** Tall live shader tile for the Backgrounds (shaders) family. */
export function BackgroundsTile({
  href,
  className,
}: {
  href: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative isolate flex h-[380px] flex-col justify-between overflow-clip rounded-panel px-6 pt-6 pb-[26px] outline-none focus-visible:ring-3 focus-visible:ring-ring xl:h-auto xl:rounded-shell xl:px-8 xl:py-[30px]",
        className,
      )}
    >
      <BentoClip slot="backgrounds" className="absolute inset-0 -z-10" />
      <span
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[linear-gradient(in_oklab_0deg,#0A040EBF_0%,#0A040E00_45%)]"
      />
      {/* Hover lift: an opacity layer, not a `filter` over the live shader. */}
      <span
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-white opacity-0 transition-opacity duration-150 ease-[ease] group-hover:opacity-[0.07]"
      />
      <p className="text-caption text-primary-tint xl:text-micro">
        Shaders, safe in 9:16
      </p>
      <div className="flex flex-col gap-2">
        <h3 className="text-[34px] leading-9 tracking-heading text-white xl:text-[40px] xl:leading-[42px]">
          Backgrounds that move.
        </h3>
        <p className="text-[15px] leading-[22px] text-[#E4E0E8]">
          Fill any aspect ratio — they’re code, not footage.
        </p>
      </div>
    </Link>
  );
}
