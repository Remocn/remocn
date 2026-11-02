"use client";

import { type CSSProperties, useState, useSyncExternalStore } from "react";
import type { ControlConfig, ControlType } from "@/lib/customizer-config";
import { cn } from "@/lib/utils";
import { BooleanControl } from "./blocks/controls/boolean-control";
import { ColorControl } from "./blocks/controls/color-control";
import { NumberControl } from "./blocks/controls/number-control";
import { SelectControl } from "./blocks/controls/select-control";
import { SliderControl } from "./blocks/controls/slider-control";
import { LONG_TEXT, TextControl } from "./blocks/controls/text-control";

type Group = { id: "content" | "timing" | "style"; title: string };

const GROUPS: Group[] = [
  { id: "content", title: "Content" },
  { id: "timing", title: "Timing" },
  { id: "style", title: "Style" },
];

/** Keys or labels that describe when and how fast things move. */
const TIMING =
  /speed|frame|duration|delay|interval|accelerat|stagger|hold|loop|timing|tempo|\(ms\)|seconds|fps|pause/i;

function groupOf(key: string, ctrl: ControlType): Group["id"] {
  if (ctrl.type === "text") return "content";
  if (TIMING.test(key) || TIMING.test(ctrl.label)) return "timing";
  return "style";
}

const isLong = (ctrl: ControlType) =>
  ctrl.type === "text" && ctrl.default.length > LONG_TEXT;

/**
 * Flex slot per control. Short copy is sized to its label and value so it
 * never truncates, word lists take the slack, transcripts get their own row.
 */
function slot(ctrl: ControlType): {
  className?: string;
  style?: CSSProperties;
} {
  if (isLong(ctrl)) return { className: "basis-full" };
  if (ctrl.type === "text" && ctrl.default.length > 40) {
    return { className: "flex-[3_1_260px]" };
  }
  if (ctrl.type === "text") {
    const width = (ctrl.label.length + ctrl.default.length) * 7 + 40;
    return { style: { flex: `1 1 ${width}px` } };
  }
  if (ctrl.type === "select") {
    const longest = Math.max(...ctrl.options.map((option) => option.length));
    const width = (ctrl.label.length + longest) * 7.5 + 64;
    return { style: { flex: `1 1 ${Math.max(width, 160)}px` } };
  }
  return { className: "flex-[1_1_160px]" };
}

/** Phones collapse every group but the first until the reader opens one. */
const PHONE = "(max-width: 767px)";
function usePhone() {
  return useSyncExternalStore(
    (notify) => {
      const query = window.matchMedia(PHONE);
      query.addEventListener("change", notify);
      return () => query.removeEventListener("change", notify);
    },
    () => window.matchMedia(PHONE).matches,
    () => false,
  );
}

function Control({
  id,
  ctrl,
  value,
  onChange,
}: {
  id: string;
  ctrl: ControlType;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  switch (ctrl.type) {
    case "number":
      return (
        <SliderControl
          label={ctrl.label}
          value={value as number}
          min={ctrl.min}
          max={ctrl.max}
          step={ctrl.step}
          onChange={onChange}
        />
      );
    case "number-input":
      return (
        <NumberControl
          id={id}
          label={ctrl.label}
          value={value as number}
          min={ctrl.min}
          max={ctrl.max}
          step={ctrl.step}
          onChange={onChange}
        />
      );
    case "select":
      return (
        <SelectControl
          id={id}
          label={ctrl.label}
          value={value as string}
          options={ctrl.options}
          onChange={onChange}
        />
      );
    case "boolean":
      return (
        <BooleanControl
          id={id}
          label={ctrl.label}
          value={value as boolean}
          onChange={onChange}
        />
      );
    case "color":
      return (
        <ColorControl
          id={id}
          label={ctrl.label}
          value={value as string}
          onChange={onChange}
        />
      );
    case "text":
      return (
        <TextControl
          id={id}
          label={ctrl.label}
          value={value as string}
          long={isLong(ctrl)}
          onChange={onChange}
        />
      );
    default: {
      // Compile-time exhaustiveness: adding a new ControlType errors here.
      const _exhaustive: never = ctrl;
      void _exhaustive;
      return null;
    }
  }
}

function GroupChevron({ open, auto }: { open: boolean; auto: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={cn(
        "size-3 shrink-0 text-white/40 transition-transform duration-150 max-md:size-3.5",
        !open && "-rotate-90",
        auto && "max-md:-rotate-90",
      )}
    >
      <path
        d="M6 9l6 6 6-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Every prop the preview honours, grouped by intent (content, timing, style)
 * into collapsible sections. Controls flow three to a row on desktop and
 * stack on phones; long text takes a full row.
 */
export function ComponentCustomizer({
  controls,
  values,
  onChange,
}: {
  controls: ControlConfig;
  values: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
}) {
  const phone = usePhone();
  const [open, setOpen] = useState<Partial<Record<Group["id"], boolean>>>({});

  const groups = GROUPS.map((group) => ({
    ...group,
    entries: Object.entries(controls).filter(
      ([key, ctrl]) => groupOf(key, ctrl) === group.id,
    ),
  })).filter((group) => group.entries.length > 0);

  return (
    <div className="flex flex-col">
      {groups.map((group, index) => {
        const chosen = open[group.id];
        // Undecided groups follow the layout: open on desktop, first-only on phones.
        const autoCollapsed = chosen === undefined && index > 0;
        const expanded = chosen ?? !(phone && index > 0);
        const panelId = `customize-${group.id}`;
        return (
          <section
            key={group.id}
            aria-label={group.title}
            className={cn(
              "flex flex-col pb-2 max-md:gap-1.5",
              index > 0 && "border-t border-white/6",
            )}
          >
            <button
              type="button"
              aria-expanded={expanded}
              aria-controls={panelId}
              onClick={() =>
                setOpen((prev) => ({ ...prev, [group.id]: !expanded }))
              }
              className="flex h-9 shrink-0 cursor-pointer items-center justify-between rounded-tile px-0.5 text-caption leading-[17px] font-semibold text-white/70 outline-none hover:text-[#fafafa] focus-visible:ring-2 focus-visible:ring-white/40 max-md:h-11 max-md:px-1.5 max-md:text-small max-md:leading-[18px]"
            >
              {group.title}
              <GroupChevron open={chosen ?? true} auto={autoCollapsed} />
            </button>
            <div
              id={panelId}
              className={cn(
                "flex flex-wrap gap-1.5",
                chosen === false && "hidden",
                autoCollapsed && "max-md:hidden",
              )}
            >
              {group.entries.map(([key, ctrl]) => {
                const { className, style } = slot(ctrl);
                return (
                  <div
                    key={key}
                    style={style}
                    className={cn("min-w-0 max-md:basis-full!", className)}
                  >
                    <Control
                      id={`ctrl-${key}`}
                      ctrl={ctrl}
                      value={values[key]}
                      onChange={(value) => onChange(key, value)}
                    />
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
