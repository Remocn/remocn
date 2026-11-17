import { formatHex, parse } from "culori";
import type { ControlConfig, ControlType } from "@/lib/customizer-config";
import type { Patch } from "./types";

/** Longest string a describe patch may write into a text prop. */
const MAX_TEXT_VALUE = 120;
const MAX_LIST_ITEMS = 50;

function roundToStep(value: number, control: { min: number; step: number }) {
  const steps = Math.round((value - control.min) / control.step);
  const rounded = control.min + steps * control.step;
  // Steps like 0.05 leave float noise (0.30000000000000004).
  return Number(rounded.toFixed(6));
}

/** A colour as `#rrggbb`, "" for the theme's own, or null when unreadable. */
export function normalizeColor(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const text = value.trim().toLowerCase();
  if (text === "" || text === "auto") return "";
  const color = parse(text);
  return color ? formatHex(color) : null;
}

function pickOption(options: string[], value: unknown): string | null {
  if (typeof value !== "string") return null;
  const wanted = value.trim().toLowerCase();
  return options.find((option) => option.toLowerCase() === wanted) ?? null;
}

function cleanText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const text = value.trim().slice(0, MAX_TEXT_VALUE);
  return text || null;
}

/** One value checked against its control, or undefined to drop it. */
export function sanitizeValue(
  control: ControlType,
  value: unknown,
  allowText: boolean,
): unknown {
  switch (control.type) {
    case "number":
    case "number-input": {
      const number = typeof value === "string" ? Number(value) : value;
      if (typeof number !== "number" || !Number.isFinite(number)) return;
      const clamped = Math.min(control.max, Math.max(control.min, number));
      return roundToStep(clamped, control);
    }
    case "color":
      return normalizeColor(value) ?? undefined;
    case "select":
    case "font":
      return pickOption(control.options, value) ?? undefined;
    case "boolean":
      if (typeof value === "boolean") return value;
      if (value === "true" || value === "false") return value === "true";
      return;
    case "text":
      return allowText ? (cleanText(value) ?? undefined) : undefined;
    case "list": {
      if (!allowText || !Array.isArray(value)) return;
      const items = value
        .slice(0, MAX_LIST_ITEMS)
        .map(cleanText)
        .filter((v): v is string => !!v);
      if (control.min !== undefined && items.length < control.min) return;
      return items.slice(0, control.max ?? items.length);
    }
  }
}

/**
 * Keeps the props the component has and makes each value one its control
 * accepts: numbers clamped and stepped, colours as hex, options from the
 * list. Text and list props are written only when `allowText` is set, i.e.
 * when the visitor typed the words themselves; a model never fills them, so
 * it can't be made to write arbitrary text.
 */
export function sanitizePatch(
  controls: ControlConfig,
  raw: Patch,
  { allowText = false }: { allowText?: boolean } = {},
): Patch {
  const out: Patch = {};
  for (const [key, value] of Object.entries(raw)) {
    const control = controls[key];
    if (!control) continue;
    const clean = sanitizeValue(control, value, allowText);
    if (clean !== undefined) out[key] = clean;
  }
  return out;
}

/** The patch without the props it would leave as they are. */
export function changedOnly(
  patch: Patch,
  values: Record<string, unknown>,
): Patch {
  const out: Patch = {};
  for (const [key, value] of Object.entries(patch)) {
    const current = values[key];
    const same = Array.isArray(value)
      ? Array.isArray(current) &&
        current.length === value.length &&
        value.every((item, i) => item === current[i])
      : Object.is(current, value);
    if (!same) out[key] = value;
  }
  return out;
}

/** Values the customizer can trust: only known props, each sanitized. */
export function sanitizeValues(
  controls: ControlConfig,
  raw: unknown,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (!raw || typeof raw !== "object") return out;
  for (const [key, control] of Object.entries(controls)) {
    const value = sanitizeValue(
      control,
      (raw as Record<string, unknown>)[key],
      true,
    );
    out[key] = value === undefined ? control.default : value;
  }
  return out;
}
