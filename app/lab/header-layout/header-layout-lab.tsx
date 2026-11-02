"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  HEADER_LAYOUT,
  type HeaderLayout,
  headerLayoutVars,
} from "@/lib/header-layout";
import { cn } from "@/lib/utils";

const VIEWPORTS = [1024, 1280, 1440, 1728] as const;
const PAGES = [
  { label: "Landing", url: "/" },
  { label: "Docs", url: "/docs/typography/soft-blur-in" },
] as const;
const PREVIEW_HEIGHT = 380;

type Control = {
  key: keyof HeaderLayout;
  label: string;
  min: number;
  max: number;
  step: number;
};

const CONTROLS: Control[] = [
  { key: "height", label: "Capsule height", min: 40, max: 72, step: 1 },
  { key: "itemHeight", label: "Item height", min: 28, max: 60, step: 1 },
  { key: "radius", label: "Capsule radius", min: 8, max: 32, step: 1 },
  { key: "itemRadius", label: "Item radius", min: 4, max: 24, step: 1 },
  { key: "top", label: "Space above", min: 0, max: 48, step: 2 },
  { key: "itemPadding", label: "Item side padding", min: 8, max: 20, step: 1 },
  { key: "text", label: "Item text", min: 13, max: 17, step: 0.5 },
  { key: "wordmark", label: "Wordmark", min: 16, max: 24, step: 0.5 },
];

type Measure = {
  /** Header block height: where the page content starts. */
  block: number;
  capsule: number;
  item: number;
};

/** Writes the layout into the header inside the iframe and measures it. */
function applyAndMeasure(
  frame: HTMLIFrameElement,
  layout: HeaderLayout,
): Measure | null {
  const doc = frame.contentDocument;
  const header = doc?.querySelector<HTMLElement>("[data-site-header]");
  if (!doc || !header) return null;
  for (const [name, value] of Object.entries(headerLayoutVars(layout))) {
    header.style.setProperty(name, String(value));
  }
  const height = (el: Element | null | undefined) =>
    Math.round(el?.getBoundingClientRect().height ?? 0);
  return {
    block: height(header),
    capsule: height(header.querySelector(":scope > div > div")),
    item: height(header.querySelector('[data-pill="nav"]')),
  };
}

function Preview({
  width,
  url,
  layout,
  onMeasure,
}: {
  width: number;
  url: string;
  layout: HeaderLayout;
  onMeasure: (key: string, measure: Measure | null) => void;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [scale, setScale] = useState(0.5);
  const [loaded, setLoaded] = useState(0);
  const key = `${url}@${width}`;

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const fit = () => setScale(Math.min(1, box.clientWidth / width));
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(box);
    return () => observer.disconnect();
  }, [width]);

  // Re-apply after every change, a load, and the page's own late layout.
  useEffect(() => {
    const frame = frameRef.current;
    if (!frame || !loaded) return;
    const run = () => onMeasure(key, applyAndMeasure(frame, layout));
    run();
    const late = window.setTimeout(run, 400);
    return () => window.clearTimeout(late);
  }, [layout, loaded, key, onMeasure]);

  return (
    <div ref={boxRef} className="w-full">
      <div
        className="relative overflow-hidden rounded-xl border border-border bg-background"
        style={{ height: PREVIEW_HEIGHT * scale }}
      >
        <iframe
          ref={frameRef}
          title={`${url} at ${width}px`}
          src={url}
          onLoad={() => setLoaded((n) => n + 1)}
          className="absolute top-0 left-0 origin-top-left border-0"
          style={{
            width,
            height: PREVIEW_HEIGHT,
            transform: `scale(${scale})`,
          }}
        />
      </div>
    </div>
  );
}

export function HeaderLayoutLab() {
  const [layout, setLayout] = useState<HeaderLayout>(HEADER_LAYOUT);
  const [pages, setPages] = useState<string[]>(PAGES.map((p) => p.url));
  const [widths, setWidths] = useState<number[]>([1440]);
  const [keepInset, setKeepInset] = useState(true);
  const [measures, setMeasures] = useState<Record<string, Measure | null>>({});
  const [written, setWritten] = useState<string | null>(null);

  const onMeasure = useCallback((key: string, measure: Measure | null) => {
    setMeasures((prev) => ({ ...prev, [key]: measure }));
  }, []);

  const set = (key: keyof HeaderLayout, value: number) =>
    setLayout((prev) => {
      const next = { ...prev, [key]: value };
      // Capsule height drags the items along so the inset around them holds.
      if (key === "height" && keepInset) {
        next.itemHeight = Math.max(28, value - (prev.height - prev.itemHeight));
      }
      return next;
    });

  const save = async () => {
    const response = await fetch("/api/lab/header-layout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(layout),
    });
    const body = (await response.json().catch(() => ({}))) as {
      path?: string;
    };
    setWritten(body.path ?? "write failed");
  };

  const toggle = <T,>(list: T[], value: T) =>
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

  const changed = (Object.keys(layout) as (keyof HeaderLayout)[]).some(
    (key) => layout[key] !== HEADER_LAYOUT[key],
  );
  const inset =
    (layout.height - Math.min(layout.itemHeight, layout.height - 4)) / 2;

  return (
    <div className="flex min-h-screen gap-4 bg-muted p-4">
      <main className="flex min-w-0 flex-1 flex-col gap-5">
        {(widths.length === 0 || pages.length === 0) && (
          <p className="text-sm text-muted-foreground">
            Pick a page and a viewport width in the panel.
          </p>
        )}
        {pages.flatMap((url) =>
          [...widths]
            .sort((a, b) => a - b)
            .map((width) => {
              const m = measures[`${url}@${width}`];
              return (
                <section
                  key={`${url}@${width}`}
                  className="flex flex-col gap-2"
                >
                  <div className="flex items-center gap-3 font-mono text-xs text-muted-foreground">
                    <span className="text-foreground">
                      {url} · {width}px
                    </span>
                    {m && (
                      <>
                        <span>capsule {m.capsule}px</span>
                        <span>item {m.item}px</span>
                        <span>header block {m.block}px</span>
                      </>
                    )}
                  </div>
                  <Preview
                    width={width}
                    url={url}
                    layout={layout}
                    onMeasure={onMeasure}
                  />
                </section>
              );
            }),
        )}
      </main>

      <aside className="sticky top-4 flex h-fit max-h-[calc(100vh-2rem)] w-[320px] shrink-0 flex-col gap-4 overflow-y-auto rounded-2xl border border-border bg-background p-4 shadow-xl">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold">Header layout</Label>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              disabled={!changed}
              onClick={() => setLayout(HEADER_LAYOUT)}
            >
              Reset
            </Button>
            <Button size="sm" onClick={save}>
              Save
            </Button>
          </div>
        </div>
        {written && (
          <p className="font-mono text-[11px] text-muted-foreground">
            wrote {written}
          </p>
        )}

        <div className="flex flex-col gap-2">
          <Label className="text-xs text-muted-foreground">Pages</Label>
          <div className="flex flex-wrap gap-1.5">
            {PAGES.map((page) => (
              <button
                key={page.url}
                type="button"
                onClick={() => setPages((prev) => toggle(prev, page.url))}
                className={cn(
                  "rounded-md border px-2 py-1 font-mono text-[11px]",
                  pages.includes(page.url)
                    ? "border-foreground bg-foreground text-background"
                    : "border-border text-muted-foreground",
                )}
              >
                {page.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label className="text-xs text-muted-foreground">Viewports</Label>
          <div className="flex flex-wrap gap-1.5">
            {VIEWPORTS.map((width) => (
              <button
                key={width}
                type="button"
                onClick={() => setWidths((prev) => toggle(prev, width))}
                className={cn(
                  "rounded-md border px-2 py-1 font-mono text-[11px]",
                  widths.includes(width)
                    ? "border-foreground bg-foreground text-background"
                    : "border-border text-muted-foreground",
                )}
              >
                {width}
              </button>
            ))}
          </div>
        </div>

        {CONTROLS.map((control) => (
          <div key={control.key} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs">{control.label}</Label>
              <span className="font-mono text-xs tabular-nums">
                {layout[control.key]}px
              </span>
            </div>
            <input
              type="range"
              min={control.min}
              max={control.max}
              step={control.step}
              value={layout[control.key]}
              onChange={(event) => set(control.key, Number(event.target.value))}
              className="accent-foreground"
            />
          </div>
        ))}

        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={keepInset}
            onChange={(event) => setKeepInset(event.target.checked)}
            className="accent-foreground"
          />
          Item height follows capsule height
        </label>
        <p className="text-[11px] leading-4 text-muted-foreground">
          Inset around items: {inset}px. Hover the previews to check the pill
          and the Docs menu. Save writes config/header-layout.json, which the
          header reads. Desktop only; the mobile header keeps its sizes, and the
          docs keep their own 20px above.
        </p>
      </aside>
    </div>
  );
}
