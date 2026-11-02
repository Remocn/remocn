"use client";

import { useEffect, useRef, useState } from "react";
import { CopyButton } from "@/components/docs/copy-button";
import { useTrackEvent } from "@/lib/analytics";
import type { ControlConfig } from "@/lib/customizer-config";
import { ComponentCustomizer } from "../component-customizer";

const CHIP =
  "flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-tile bg-white/5 px-3 text-caption font-medium text-white/70 outline-none transition-colors duration-150 hover:bg-white/10 hover:text-[#fafafa] focus-visible:ring-2 focus-visible:ring-white/40 disabled:cursor-default disabled:opacity-40 disabled:hover:bg-white/5 disabled:hover:text-white/70 max-md:h-11 max-md:flex-1 max-md:justify-center max-md:rounded-[10px] max-md:bg-white/8";

function Icon({ d }: { d: string[] }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="size-[13px] shrink-0 text-[#c9cdd0]"
    >
      {d.map((path) => (
        <path
          key={path}
          d={path}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </svg>
  );
}

function SlidersIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="size-3.5 shrink-0 text-dark-subtle"
    >
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      >
        <path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
        <circle cx="16" cy="7" r="2" />
        <circle cx="10" cy="17" r="2" />
      </g>
    </svg>
  );
}

/**
 * "Customize" section of the player: prop count, reset, a share link that
 * carries the current values in the URL, copy of the generated code, and the
 * grouped controls.
 */
export function CustomizePanel({
  name,
  controls,
  values,
  code,
  isDefault,
  onChange,
  onReset,
}: {
  name: string;
  controls: ControlConfig;
  values: Record<string, unknown>;
  code: string;
  isDefault: boolean;
  onChange: (key: string, value: unknown) => void;
  onReset: () => void;
}) {
  const trackEvent = useTrackEvent();
  const [shared, setShared] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const share = async () => {
    const ok = await navigator.clipboard.writeText(window.location.href).then(
      () => true,
      () => false,
    );
    if (!ok) return;
    setShared(true);
    trackEvent("customized_link_shared", { component: name });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setShared(false), 1500);
  };

  const count = Object.keys(controls).length;

  return (
    <div className="flex flex-col gap-2 max-md:border-t max-md:border-white/6 max-md:pt-2.5">
      <div className="flex h-[34px] shrink-0 items-center justify-between gap-3 pr-1 pl-2 max-md:h-auto max-md:flex-col max-md:items-stretch max-md:gap-2 max-md:p-0">
        <div className="flex items-center gap-2.5 max-md:h-7 max-md:px-1.5">
          <SlidersIcon />
          <span className="text-small text-[#fafafa] max-md:text-[15px]">
            Customize
          </span>
          <span className="text-mono text-dark-subtle tabular-nums max-md:text-caption">
            {count} {count === 1 ? "prop" : "props"}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onReset}
            disabled={isDefault}
            className={CHIP}
          >
            <Icon d={["M3 12a9 9 0 1 0 3-6.7L3 8", "M3 3v5h5"]} />
            Reset
          </button>
          <button type="button" onClick={share} className={CHIP}>
            <Icon
              d={[
                "M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1",
                "M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1",
              ]}
            />
            {/* Both labels share one cell so the chip keeps its width. */}
            <span className="grid text-center">
              <span aria-live="polite" className="col-start-1 row-start-1">
                {shared ? "Copied" : "Share link"}
              </span>
              <span
                aria-hidden="true"
                className="invisible col-start-1 row-start-1"
              >
                {shared ? "Share link" : "Copied"}
              </span>
            </span>
          </button>
          <CopyButton value={code} label="Copy code" variant="light" />
        </div>
      </div>
      <ComponentCustomizer
        controls={controls}
        values={values}
        onChange={onChange}
      />
    </div>
  );
}
