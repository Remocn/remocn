"use client";

import { Field, FieldDescription, FieldLabel } from "@ui-sdk/react/field";
import { Textarea } from "@ui-sdk/react/textarea";
import { useState } from "react";
import type { ChangeSource } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import {
  CONTROL,
  CONTROL_FOCUS,
  CONTROL_LABEL,
  CONTROL_VALUE,
} from "./control-styles";

/**
 * Lines as list items: blank lines drop out, a fixed-length list (a tuple
 * prop) keeps its first `max` lines and takes missing ones from `fallback`.
 */
export function linesToItems(
  text: string,
  fallback: readonly string[],
  min = 0,
  max = Number.POSITIVE_INFINITY,
): string[] {
  const items = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, max);
  for (let i = items.length; i < min; i += 1) items.push(fallback[i] ?? "");
  return items;
}

const sameItems = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((item, i) => item === b[i]);

/**
 * A `string[]` prop: one item per line. The field keeps what the reader
 * typed, blank lines included, while the prop gets the cleaned list, so
 * pressing Enter for a new line doesn't eat the line break.
 */
export function ListControl({
  label,
  value,
  fallback,
  min,
  max,
  onChange,
}: {
  id: string;
  label: string;
  value: string[];
  /** Items a fixed-length list falls back to when lines are missing. */
  fallback: readonly string[];
  min?: number;
  max?: number;
  onChange: (value: string[], source?: ChangeSource) => void;
}) {
  const [draft, setDraft] = useState(() => value.join("\n"));
  // Undo, Reset or an agent can change the value from outside; the draft
  // follows unless it already says the same thing.
  if (!sameItems(linesToItems(draft, fallback, min, max), value)) {
    setDraft(value.join("\n"));
  }
  const fixed = min !== undefined && min === max;

  return (
    <Field
      className={cn(
        CONTROL,
        CONTROL_FOCUS,
        "h-auto flex-col items-stretch gap-2 py-3 max-md:h-auto",
      )}
    >
      <span className="flex items-baseline justify-between gap-3">
        <FieldLabel className={CONTROL_LABEL}>{label}</FieldLabel>
        <FieldDescription className="text-white/40">
          {fixed ? `${max} lines` : "One per line"}
        </FieldDescription>
      </span>
      <Textarea
        autoResize
        rows={Math.min(Math.max(value.length, 2), 6)}
        spellCheck={false}
        value={draft}
        onValueChange={(next, details) => {
          setDraft(next);
          const items = linesToItems(next, fallback, min, max);
          if (!sameItems(items, value)) onChange(items, details.source);
        }}
        className={cn(
          CONTROL_VALUE,
          "min-h-[40px] w-full resize-none bg-transparent text-caption leading-5 font-normal caret-primary-soft outline-none max-md:text-base",
        )}
      />
    </Field>
  );
}
