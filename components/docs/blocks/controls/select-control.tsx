"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectItemIndicator,
  SelectTrigger,
  SelectValue,
} from "@ui-sdk/react/select";
import { cn } from "@/lib/utils";
import { CONTROL, CONTROL_LABEL, CONTROL_VALUE } from "./control-styles";

function Chevron() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="size-3 shrink-0 text-dark-subtle transition-transform duration-150 group-data-open/select:rotate-180"
    >
      <path
        d="m6 9 6 6 6-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Enum prop: the tile opens a dark list of options under it, or a bottom
 * sheet on small touch screens.
 */
export function SelectControl({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <Select
      value={value}
      presentation="auto"
      onValueChange={(next) => {
        if (next !== null) onChange(next as string);
      }}
    >
      <SelectTrigger
        id={id}
        aria-label={label}
        className={cn(
          CONTROL,
          "group/select w-full cursor-pointer outline-none focus-visible:ring-[1.5px] focus-visible:ring-primary-bright focus-visible:ring-inset data-open:bg-white/8",
        )}
      >
        <span aria-hidden="true" className={CONTROL_LABEL}>
          {label}
        </span>
        <span className="flex min-w-0 items-center gap-2">
          <SelectValue className={cn(CONTROL_VALUE, "truncate")} />
          <Chevron />
        </span>
      </SelectTrigger>
      <SelectContent
        side="bottom"
        sideOffset={6}
        className="m-0 right-auto bottom-auto flex h-fit max-h-(--available-height) w-(--anchor-width) origin-(--transform-origin) flex-col gap-0.5 overflow-y-auto overscroll-contain rounded-control-sm border border-dark-border bg-dark-raised p-1 text-inherit shadow-[0_12px_24px_-8px_rgb(0_0_0/60%)] outline-none transition-[opacity,scale] duration-150 ease-[cubic-bezier(0.19,1,0.22,1)] data-ending-style:scale-98 data-ending-style:opacity-0 data-ending-style:duration-100 data-ending-style:ease-[ease] data-starting-style:scale-98 data-starting-style:opacity-0 motion-reduce:transition-opacity data-[presentation=sheet]:max-h-[70dvh] data-[presentation=sheet]:w-full data-[presentation=sheet]:rounded-b-none data-[presentation=sheet]:border-x-0 data-[presentation=sheet]:border-b-0 data-[presentation=sheet]:px-2 data-[presentation=sheet]:pt-2 data-[presentation=sheet]:pb-[max(8px,env(safe-area-inset-bottom))] data-[presentation=sheet]:transition-none"
      >
        {options.map((option) => (
          <SelectItem
            key={option}
            value={option}
            className="flex h-8 shrink-0 cursor-pointer items-center justify-between gap-3 rounded-tile px-2.5 text-caption text-[#c9cdd0] outline-none select-none data-highlighted:bg-white/8 data-selected:text-[#f4f4f5] max-md:h-11 max-md:text-small"
          >
            {option}
            <SelectItemIndicator className="flex">
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="size-[13px] text-[#f4f4f5]"
              >
                <path
                  d="M20 6 9 17l-5-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </SelectItemIndicator>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
