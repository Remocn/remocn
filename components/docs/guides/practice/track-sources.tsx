import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { guideCard } from "../guide-ui";
import { findLink, listItems, textOf } from "../mdx-children";

/** Wordmarks for the libraries the guide recommends, keyed by host. */
const LOGOS: { host: string; mark: ReactNode }[] = [
  {
    host: "pixabay.com",
    mark: (
      <>
        <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true">
          <rect width="30" height="30" rx="8" fill="#2EC66D" />
          <path
            d="M11 22V9h5.2a4.3 4.3 0 0 1 0 8.6H11"
            fill="none"
            stroke="#fff"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="text-[#2EC66D]">pixabay</span>
      </>
    ),
  },
  {
    host: "uppbeat.io",
    mark: (
      <>
        <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true">
          <rect width="30" height="30" rx="15" fill="#F2386C" />
          <path
            d="M10 9v7a5 5 0 0 0 10 0V9"
            fill="none"
            stroke="#fff"
            strokeWidth="2.6"
            strokeLinecap="round"
          />
        </svg>
        <span className="text-foreground">uppbeat</span>
      </>
    ),
  },
  {
    host: "youtube.com",
    mark: (
      <>
        <svg width="40" height="28" viewBox="0 0 40 28" aria-hidden="true">
          <rect width="40" height="28" rx="8" fill="#FF0033" />
          <path d="M16 8.5v11l9.5-5.5z" fill="#fff" />
        </svg>
        <span className="tracking-[-0.04em] text-foreground">YouTube</span>
      </>
    ),
  },
];

/**
 * Where to get a track: one card per library. Children: a markdown list of
 * `[Library](url) — what the license is`.
 */
export function GuideTrackSources({ children }: { children: ReactNode }) {
  const items = listItems(children).map((item) => {
    const link = findLink(item);
    const href = typeof link?.props.href === "string" ? link.props.href : "#";
    const name = textOf(link?.props.children);
    const note = textOf(item)
      .replace(name, "")
      .replace(/^\s*—\s*/, "")
      .trim();
    return { href, name, note };
  });

  return (
    <ul className="not-prose mt-4 grid gap-3 sm:grid-cols-3 sm:gap-5">
      {items.map((item) => {
        const logo = LOGOS.find((entry) => item.href.includes(entry.host));
        return (
          <li key={item.href}>
            <a
              href={item.href}
              target="_blank"
              rel="noreferrer"
              className={cn(
                "flex h-full items-center gap-3 rounded-card p-1.5 transition-shadow hover:shadow-[0_0_0_1px_var(--color-divider)] focus-visible:ring-3 focus-visible:ring-ring focus-visible:outline-none sm:flex-col sm:items-stretch sm:gap-0",
                guideCard,
              )}
            >
              <span
                aria-hidden="true"
                className="flex h-14 w-[132px] shrink-0 items-center justify-center gap-2 rounded-control bg-surface-muted text-[17px] leading-lead font-bold tracking-[-0.03em] sm:h-[104px] sm:w-auto sm:text-[22px] [&_svg]:max-sm:scale-75"
              >
                {logo?.mark}
              </span>
              <span className="flex flex-col gap-1 py-2 pr-2 sm:px-3 sm:pt-3.5 sm:pb-3">
                <span className="text-[15px] leading-5 font-medium text-foreground">
                  {item.name}
                </span>
                <span className="text-small text-muted-foreground">
                  {capitalize(item.note)}
                </span>
              </span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
