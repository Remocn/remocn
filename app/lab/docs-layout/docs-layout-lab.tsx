"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  DOCS_LAYOUT,
  type DocsLayout,
  docsLayoutVars,
} from "@/lib/docs-layout";
import { cn } from "@/lib/utils";

const VIEWPORTS = [1280, 1440, 1728, 1920, 2560] as const;
const PREVIEW_HEIGHT = 900;

type Control = {
  key: keyof DocsLayout;
  label: string;
  min: number;
  max: number;
  step: number;
  hint?: string;
};

const CONTROLS: Control[] = [
  { key: "frame", label: "Frame max width", min: 1200, max: 2400, step: 8 },
  { key: "gutter", label: "Frame side padding", min: 16, max: 96, step: 4 },
  { key: "sidebar", label: "Sidebar width", min: 220, max: 360, step: 4 },
  { key: "rail", label: "Right rail width", min: 240, max: 400, step: 4 },
  {
    key: "articlePadding",
    label: "Article side padding",
    min: 24,
    max: 120,
    step: 4,
  },
  {
    key: "articleMax",
    label: "Article max width",
    min: 0,
    max: 1200,
    step: 10,
    hint: "0 = fills the column",
  },
];

type Measure = {
  article: number;
  frame: number;
  /** Rail content left edge minus the Healthy badge's (0 = aligned). */
  railOffset: number | null;
};

/** Writes the layout into the docs page inside the iframe and measures it. */
function applyAndMeasure(
  frame: HTMLIFrameElement,
  layout: DocsLayout,
): Measure | null {
  const doc = frame.contentDocument;
  const root = doc?.querySelector<HTMLElement>("[data-docs-layout]");
  if (!doc || !root) return null;
  for (const [name, value] of Object.entries(docsLayoutVars(layout))) {
    root.style.setProperty(name, String(value));
  }
  const left = (el: Element | null | undefined) =>
    el ? el.getBoundingClientRect().left : null;
  const health = [...doc.querySelectorAll("header button")].find((el) =>
    /Healthy|Degraded|Unhealthy/.test(el.textContent ?? ""),
  );
  const rail = doc.querySelector("[data-docs-rail] > :first-child");
  const article = doc.querySelector("article");
  const shell = doc.querySelector("header > div");
  const healthLeft = left(health);
  const railLeft = left(rail);
  return {
    article: Math.round(article?.getBoundingClientRect().width ?? 0),
    frame: Math.round(shell?.getBoundingClientRect().width ?? 0),
    railOffset:
      healthLeft !== null && railLeft !== null
        ? Math.round(railLeft - healthLeft)
        : null,
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
  layout: DocsLayout;
  onMeasure: (width: number, measure: Measure | null) => void;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [scale, setScale] = useState(0.5);
  const [loaded, setLoaded] = useState(0);

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const fit = () => setScale(Math.min(1, box.clientWidth / width));
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(box);
    return () => observer.disconnect();
  }, [width]);

  // Re-apply after every change, a load, and the page's own late layout
  // (fonts, client navigation inside the frame).
  useEffect(() => {
    const frame = frameRef.current;
    if (!frame || !loaded) return;
    const run = () => onMeasure(width, applyAndMeasure(frame, layout));
    run();
    const late = window.setTimeout(run, 400);
    return () => window.clearTimeout(late);
  }, [layout, loaded, width, onMeasure]);

  return (
    <div ref={boxRef} className="w-full">
      <div
        className="relative overflow-hidden rounded-xl border border-border bg-background"
        style={{ height: PREVIEW_HEIGHT * scale }}
      >
        <iframe
          ref={frameRef}
          title={`Docs at ${width}px`}
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

export function DocsLayoutLab() {
  const [layout, setLayout] = useState<DocsLayout>(DOCS_LAYOUT);
  const [url, setUrl] = useState("/docs/typography/soft-blur-in");
  const [draftUrl, setDraftUrl] = useState(url);
  const [widths, setWidths] = useState<number[]>([1440, 1728]);
  const [measures, setMeasures] = useState<Record<number, Measure | null>>({});
  const [written, setWritten] = useState<string | null>(null);

  const onMeasure = useCallback((width: number, measure: Measure | null) => {
    setMeasures((prev) => ({ ...prev, [width]: measure }));
  }, []);

  const set = (key: keyof DocsLayout, value: number) =>
    setLayout((prev) => ({ ...prev, [key]: value }));

  const alignRail = () => {
    const offset = widths
      .map((w) => measures[w]?.railOffset)
      .find((value) => typeof value === "number");
    if (typeof offset === "number") set("rail", layout.rail + offset);
  };

  const save = async () => {
    const response = await fetch("/api/lab/docs-layout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(layout),
    });
    const body = (await response.json().catch(() => ({}))) as {
      path?: string;
    };
    setWritten(body.path ?? "write failed");
  };

  const toggleWidth = (width: number) =>
    setWidths((prev) =>
      prev.includes(width)
        ? prev.filter((w) => w !== width)
        : [...prev, width].sort((a, b) => a - b),
    );

  const changed = (Object.keys(layout) as (keyof DocsLayout)[]).some(
    (key) => layout[key] !== DOCS_LAYOUT[key],
  );

  return (
    <div className="flex min-h-screen gap-4 bg-muted p-4">
      <main className="flex min-w-0 flex-1 flex-col gap-5">
        {widths.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Pick a viewport width in the panel.
          </p>
        )}
        {widths.map((width) => {
          const m = measures[width];
          return (
            <section key={width} className="flex flex-col gap-2">
              <div className="flex items-center gap-3 font-mono text-xs text-muted-foreground">
                <span className="text-foreground">{width}px viewport</span>
                {m && (
                  <>
                    <span>frame {m.frame}px</span>
                    <span>article {m.article}px</span>
                    <span
                      className={cn(
                        m.railOffset === 0
                          ? "text-emerald-600"
                          : "text-amber-600",
                      )}
                    >
                      Rail vs Healthy{" "}
                      {m.railOffset === null
                        ? "n/a"
                        : m.railOffset === 0
                          ? "aligned"
                          : `${m.railOffset > 0 ? "+" : ""}${m.railOffset}px`}
                    </span>
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
        })}
      </main>

      <aside className="sticky top-4 flex h-fit max-h-[calc(100vh-2rem)] w-[320px] shrink-0 flex-col gap-4 overflow-y-auto rounded-2xl border border-border bg-background p-4 shadow-xl">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold">Docs layout</Label>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              disabled={!changed}
              onClick={() => setLayout(DOCS_LAYOUT)}
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
          <Label className="text-xs text-muted-foreground">Viewports</Label>
          <div className="flex flex-wrap gap-1.5">
            {VIEWPORTS.map((width) => (
              <button
                key={width}
                type="button"
                onClick={() => toggleWidth(width)}
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

        <form
          className="flex flex-col gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            setUrl(draftUrl);
          }}
        >
          <Label className="text-xs text-muted-foreground">Page</Label>
          <input
            value={draftUrl}
            onChange={(event) => setDraftUrl(event.target.value)}
            className="h-8 rounded-md border border-border bg-background px-2 font-mono text-xs"
          />
        </form>

        {CONTROLS.map((control) => (
          <div key={control.key} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs">{control.label}</Label>
              <span className="font-mono text-xs tabular-nums">
                {control.key === "articleMax" && layout.articleMax === 0
                  ? "none"
                  : `${layout[control.key]}px`}
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
            {control.hint && (
              <span className="text-[11px] text-muted-foreground">
                {control.hint}
              </span>
            )}
          </div>
        ))}

        <Button size="sm" variant="secondary" onClick={alignRail}>
          Align rail to Healthy
        </Button>
        <p className="text-[11px] leading-4 text-muted-foreground">
          Changes the rail width so its cards start where the Healthy badge
          does. Save writes config/docs-layout.json, which the docs read.
        </p>
      </aside>
    </div>
  );
}
