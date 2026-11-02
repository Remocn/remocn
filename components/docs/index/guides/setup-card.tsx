import type { ReactNode } from "react";
import { LandingButton } from "@/app/(home)/components/landing/ui/landing-button";
import { cn } from "@/lib/utils";
import { getEntry, loadDocsSource } from "../data";
import { indexCard } from "../index-section";

/**
 * "First time here?" callout that sends newcomers to the guides setup page.
 * The title and line are MDX; the target is the setup page from the tree.
 */
export async function SetupCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  await loadDocsSource();
  const setup = getEntry("/docs/guides/setup");
  if (!setup) return null;

  return (
    <div
      data-not-typeset
      className={cn(
        indexCard,
        "not-prose mt-8 flex flex-col gap-3.5 p-4 sm:mt-5 sm:flex-row sm:items-center sm:gap-[18px] sm:py-[18px] sm:pr-[18px] sm:pl-5",
      )}
    >
      <div className="flex grow items-start gap-3.5 sm:items-center sm:gap-[18px]">
        <span
          aria-hidden="true"
          className="flex size-11 shrink-0 items-center justify-center rounded-control-sm bg-surface-muted"
        >
          <svg
            viewBox="0 0 24 24"
            className="size-5 fill-none stroke-foreground stroke-[1.8] [stroke-linecap:round] [stroke-linejoin:round]"
          >
            <path d="M4 17V7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10M2 19h20M8 9l3 3-3 3M13 15h3" />
          </svg>
        </span>
        <div className="flex grow flex-col gap-0.5">
          <p className="text-ui leading-[22px] font-medium text-foreground">
            {title}
          </p>
          <div className="text-small text-muted-foreground">{children}</div>
        </div>
      </div>
      <LandingButton
        href={setup.url}
        arrow="→"
        className="h-12 w-full rounded-control text-ui leading-5 font-medium sm:h-10 sm:w-auto sm:rounded-control-sm sm:px-4 sm:text-small sm:leading-[18px]"
      >
        Start {setup.title.toLowerCase()}
      </LandingButton>
    </div>
  );
}
