"use client";

import { Button } from "@ui-sdk/react/button";
import { usePathname } from "next/navigation";
import { type KeyboardEvent, useEffect, useRef, useState } from "react";
import { CopyButton } from "@/components/docs/copy-button";
import { agentPrompt } from "@/lib/agent-prompt";
import { type ChangeSource, useTrackEvent } from "@/lib/analytics";
import type { ControlConfig } from "@/lib/customizer-config";
import { useAgentBridge } from "../agent/use-agent-bridge";
import { ComponentCustomizer } from "../component-customizer";
import { OpenInAgent } from "../open-in-agent";

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

const ICON_BUTTON =
  "flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-tile text-white/70 outline-none transition-colors duration-150 hover:bg-white/10 hover:text-[#fafafa] focus-visible:ring-2 focus-visible:ring-white/40 disabled:cursor-default disabled:opacity-40 disabled:hover:bg-transparent max-md:size-11";

export type UndoControls = {
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
};

// Text fields keep the browser's own undo for what is being typed.
const TEXT_FIELD =
  "textarea, input:not([type=range], [type=checkbox], [type=radio], [type=button])";

/**
 * "Customize" section of the player: prop count, undo/redo, reset, a share
 * link that carries the current values in the URL, copy of the generated
 * code, and the grouped controls.
 */
export function CustomizePanel({
  name,
  controls,
  values,
  code,
  isDefault,
  onChange,
  onReset,
  history,
}: {
  name: string;
  controls: ControlConfig;
  values: Record<string, unknown>;
  code: string;
  isDefault: boolean;
  onChange: (key: string, value: unknown, source?: ChangeSource) => void;
  onReset: () => void;
  history?: UndoControls;
}) {
  const trackEvent = useTrackEvent();
  const pathname = usePathname();
  useAgentBridge();
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

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!history || !(event.metaKey || event.ctrlKey) || event.altKey) return;
    if ((event.target as Element).closest(TEXT_FIELD)) return;
    const key = event.key.toLowerCase();
    const redo =
      (key === "z" && event.shiftKey) || (key === "y" && event.ctrlKey);
    if (key !== "z" && !redo) return;
    event.preventDefault();
    if (redo) history.redo();
    else history.undo();
  };

  const count = Object.keys(controls).length;

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: listens for shortcuts bubbling from the controls inside
    <div
      onKeyDown={onKeyDown}
      className="flex flex-col gap-2 max-md:border-t max-md:border-white/6 max-md:pt-2.5"
    >
      <div className="flex min-h-[34px] shrink-0 flex-wrap items-center justify-between gap-x-3 gap-y-1.5 pr-1 pl-2 max-md:flex-col max-md:flex-nowrap max-md:items-stretch max-md:gap-2 max-md:p-0">
        <div className="flex items-center gap-2.5 max-md:min-h-7 max-md:px-1.5">
          <SlidersIcon />
          <span className="text-small text-[#fafafa] max-md:text-[15px]">
            Customize
          </span>
          <span className="text-mono text-dark-subtle tabular-nums max-md:text-caption">
            {count} {count === 1 ? "prop" : "props"}
          </span>
          {history ? (
            <span className="flex items-center gap-0.5 max-md:ml-auto max-md:-my-2 max-md:-mr-1.5">
              <Button
                aria-label="Undo"
                aria-keyshortcuts="Meta+Z Control+Z"
                onClick={history.undo}
                disabled={!history.canUndo}
                className={ICON_BUTTON}
              >
                <Icon
                  d={["M9 14 4 9l5-5", "M4 9h10.5a5.5 5.5 0 0 1 0 11H11"]}
                />
              </Button>
              <Button
                aria-label="Redo"
                aria-keyshortcuts="Meta+Shift+Z Control+Shift+Z Control+Y"
                onClick={history.redo}
                disabled={!history.canRedo}
                className={ICON_BUTTON}
              >
                <Icon
                  d={["m15 14 5-5-5-5", "M20 9H9.5a5.5 5.5 0 0 0 0 11H13"]}
                />
              </Button>
            </span>
          ) : null}
        </div>
        <div className="ml-auto flex items-center gap-1.5 max-md:ml-0 max-md:grid max-md:grid-cols-2">
          <Button onClick={onReset} disabled={isDefault} className={CHIP}>
            <Icon d={["M3 12a9 9 0 1 0 3-6.7L3 8", "M3 3v5h5"]} />
            Reset
          </Button>
          <Button onClick={share} data-agent-hidden="" className={CHIP}>
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
          </Button>
          <OpenInAgent
            prompt={agentPrompt({ name, code, pathname })}
            component={name}
            surface="customizer"
            variant="chip"
          />
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
