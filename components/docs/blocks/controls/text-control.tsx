"use client";

import { Field, FieldLabel } from "@ui-sdk/react/field";
import { Input } from "@ui-sdk/react/input";
import { Textarea } from "@ui-sdk/react/textarea";
import type { ChangeSource } from "@/lib/analytics";
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
  label,
  value,
  long,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  long?: boolean;
  onChange: (value: string, source?: ChangeSource) => void;
}) {
  if (long) {
    return (
      <Field
        className={cn(
          CONTROL,
          CONTROL_FOCUS,
          "h-auto flex-col items-stretch gap-2 py-3 max-md:h-auto",
        )}
      >
        <FieldLabel className={CONTROL_LABEL}>{label}</FieldLabel>
        <Textarea
          autoResize
          rows={3}
          spellCheck={false}
          value={value}
          onValueChange={(next, details) => onChange(next, details.source)}
          className={cn(
            CONTROL_VALUE,
            "min-h-[60px] w-full resize-none bg-transparent text-caption leading-5 font-normal caret-primary-soft outline-none max-md:text-base",
          )}
        />
      </Field>
    );
  }

  return (
    <Field className={cn(CONTROL, CONTROL_FOCUS)}>
      <FieldLabel className={CONTROL_LABEL}>{label}</FieldLabel>
      <Input
        type="text"
        spellCheck={false}
        autoComplete="off"
        value={value}
        onValueChange={(next, details) => onChange(next, details.source)}
        className={cn(
          CONTROL_VALUE,
          "min-w-0 flex-1 truncate bg-transparent text-right caret-primary-soft outline-none max-md:text-base",
        )}
      />
    </Field>
  );
}
