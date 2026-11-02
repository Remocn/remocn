import Image from "next/image";
import { cn } from "@/lib/utils";
import type { CreditEntry as Entry } from "./credit-groups";

/** Wordmark heights from the design; everything else sits at 24px. */
const WORDMARK_HEIGHT: Record<string, string> = {
  neon: "h-10",
  vidrush: "h-7",
  reactbits: "h-[21px]",
  reactvideoeditor: "h-[26px]",
};

const MARK_SIZE: Record<string, string> = {
  aceternity: "size-[25px]",
};

const LINK =
  "-mx-2 inline-flex h-10 items-center rounded-tile px-2 outline-none transition-colors duration-150 hover:bg-white/[0.06] focus-visible:ring-2 focus-visible:ring-white/40";

function EntryContent({ entry }: { entry: Entry }) {
  const { logo } = entry;

  if (entry.kind === "name" || !logo) {
    return (
      <span className="text-[17px] leading-[22px] text-dark-subtle transition-colors duration-150 group-hover:text-[#fafafa]">
        {entry.name}
      </span>
    );
  }

  if (entry.kind === "mark") {
    return (
      <span className="flex items-center gap-[9px]">
        <Image
          src={logo.src}
          alt=""
          width={28}
          height={28}
          className={cn(
            "shrink-0 object-cover",
            logo.avatar ? "rounded-full" : "rounded-tag",
            logo.invert && "invert",
            MARK_SIZE[entry.id] ?? "size-7",
          )}
        />
        <span className="text-[20px] leading-7 font-semibold tracking-[-0.03em] whitespace-nowrap text-[#fafafa]">
          {entry.name}
        </span>
      </span>
    );
  }

  return (
    <Image
      src={logo.src}
      alt={entry.name}
      width={160}
      height={40}
      className={cn(
        "w-auto max-w-none shrink-0",
        logo.invert && "invert",
        WORDMARK_HEIGHT[entry.id] ?? "h-6",
      )}
    />
  );
}

/** One credited sponsor: its logo (or name) linking out in a new tab. */
export function CreditEntry({ entry }: { entry: Entry }) {
  return (
    <a
      href={entry.website}
      target="_blank"
      rel="noreferrer"
      className={cn("group", LINK)}
    >
      <EntryContent entry={entry} />
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}
