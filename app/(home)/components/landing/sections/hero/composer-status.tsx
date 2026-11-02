"use client";

import { useComposerSignal } from "./scenes/composer-signal";

export function ComposerStatus() {
  const { composed } = useComposerSignal();
  const label =
    composed >= 6
      ? "All 6 scenes composed"
      : `Composing scene ${composed + 1} of 6`;
  return (
    <div className="flex justify-center px-5 md:pt-7">
      <p className="flex items-center gap-3 rounded-control-sm bg-[#F0F0F1] px-4 py-2.5 text-[#3F4A4F] md:gap-2.5 md:px-3.5 md:py-2 dark:bg-muted dark:text-body">
        <span
          aria-hidden="true"
          className="size-2 shrink-0 rounded-full bg-primary shadow-[0_0_0_4px_#A800B729]"
        />
        <span className="flex flex-col gap-0.5 md:hidden">
          <span className="text-caption tabular-nums">{label}</span>
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span className="text-caption">Preview at</span>
            <span className="font-mono text-mono">localhost:3000</span>
          </span>
        </span>
        <span className="hidden text-mono tabular-nums md:inline">
          {label}, preview at <span className="font-mono">localhost:3000</span>
        </span>
      </p>
    </div>
  );
}
