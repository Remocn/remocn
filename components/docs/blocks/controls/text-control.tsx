"use client";

import { cn } from "@/lib/utils";
import {
  CONTROL,
  CONTROL_FOCUS,
  CONTROL_LABEL,
  CONTROL_VALUE,
} from "./control-styles";

/** Values longer than this get the multi-line field (transcripts, prose). */
export const LONG_TEXT = 120;

/**
 * Text prop: an inline field for short copy, a labeled textarea for long copy
 * such as caption transcripts.
 */
export function TextControl({
  id,
  label,
  value,
  long,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  long?: boolean;
  onChange: (value: string) => void;
}) {
  if (long) {
    return (
      <div
        className={cn(
          CONTROL,
          CONTROL_FOCUS,
          "h-auto flex-col items-stretch gap-2 py-3 max-md:h-auto",
        )}
      >
        <label htmlFor={id} className={CONTROL_LABEL}>
          {label}
        </label>
        <textarea
          id={id}
          rows={3}
          spellCheck={false}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            CONTROL_VALUE,
            "field-sizing-content min-h-[60px] w-full resize-none bg-transparent text-caption leading-5 font-normal caret-primary-soft outline-none max-md:text-base",
          )}
        />
      </div>
    );
  }

  return (
    <div className={cn(CONTROL, CONTROL_FOCUS)}>
      <label htmlFor={id} className={CONTROL_LABEL}>
        {label}
      </label>
      <input
        id={id}
        type="text"
        spellCheck={false}
        autoComplete="off"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          CONTROL_VALUE,
          "min-w-0 flex-1 truncate bg-transparent text-right caret-primary-soft outline-none max-md:text-base",
        )}
      />
    </div>
  );
}
