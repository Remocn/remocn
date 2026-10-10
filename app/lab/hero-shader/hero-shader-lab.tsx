"use client";

import { ArrowRight } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  type ControlConfig,
  type ControlType,
  getDefaults,
} from "@/lib/customizer-config";

const RemocnShader = dynamic(
  () => import("@/components/RemocnShader.webgl").then((m) => m.RemocnShader),
  { ssr: false },
);

const PANEL_WIDTH = 360;
const BACKGROUND = { dark: "#090b0c", light: "#ffffff" };

const CONTROLS: ControlConfig = {
  theme: {
    type: "select",
    default: "dark",
    options: ["dark", "light"],
    label: "Theme",
  },
  maskOnly: { type: "boolean", default: false, label: "Show mask only" },

  offsetTop: {
    type: "number",
    default: -288,
    min: -700,
    max: 200,
    step: 4,
    label: "Offset top (px)",
  },
  height: {
    type: "number",
    default: 100,
    min: 60,
    max: 180,
    step: 5,
    label: "Height (vh)",
  },

  vignette: { type: "boolean", default: true, label: "L1 vignette" },
  vignetteW: {
    type: "number",
    default: 92,
    min: 20,
    max: 200,
    step: 2,
    label: "L1 width %",
  },
  vignetteH: {
    type: "number",
    default: 68,
    min: 10,
    max: 200,
    step: 2,
    label: "L1 height %",
  },
  vignetteX: {
    type: "number",
    default: 50,
    min: 0,
    max: 100,
    step: 1,
    label: "L1 center X %",
  },
  vignetteY: {
    type: "number",
    default: 58,
    min: -50,
    max: 150,
    step: 1,
    label: "L1 center Y %",
  },
  vignetteSolid: {
    type: "number",
    default: 14,
    min: 0,
    max: 100,
    step: 2,
    label: "L1 solid stop %",
  },
  vignetteFade: {
    type: "number",
    default: 84,
    min: 0,
    max: 100,
    step: 2,
    label: "L1 fade stop %",
  },

  vertical: { type: "boolean", default: true, label: "L2 vertical fade" },
  verticalTop: {
    type: "number",
    default: 4,
    min: -50,
    max: 100,
    step: 2,
    label: "L2 top clear %",
  },
  verticalIn: {
    type: "number",
    default: 30,
    min: -50,
    max: 100,
    step: 2,
    label: "L2 top solid %",
  },
  verticalOut: {
    type: "number",
    default: 88,
    min: 0,
    max: 150,
    step: 2,
    label: "L2 bottom solid %",
  },
  verticalEnd: {
    type: "number",
    default: 100,
    min: 0,
    max: 150,
    step: 2,
    label: "L2 bottom clear %",
  },

  well: { type: "boolean", default: true, label: "L3 copy well" },
  wellW: {
    type: "number",
    default: 44,
    min: 0,
    max: 150,
    step: 2,
    label: "L3 width %",
  },
  wellH: {
    type: "number",
    default: 30,
    min: 0,
    max: 150,
    step: 2,
    label: "L3 height %",
  },
  wellX: {
    type: "number",
    default: 50,
    min: 0,
    max: 100,
    step: 1,
    label: "L3 center X %",
  },
  wellY: {
    type: "number",
    default: 31,
    min: -50,
    max: 150,
    step: 1,
    label: "L3 center Y %",
  },
  wellClear: {
    type: "number",
    default: 46,
    min: 0,
    max: 100,
    step: 2,
    label: "L3 clear stop %",
  },
  wellSolid: {
    type: "number",
    default: 92,
    min: 0,
    max: 100,
    step: 2,
    label: "L3 solid stop %",
  },
};

type LabValues = {
  theme: string;
  maskOnly: boolean;
  offsetTop: number;
  height: number;
  vignette: boolean;
  vignetteW: number;
  vignetteH: number;
  vignetteX: number;
  vignetteY: number;
  vignetteSolid: number;
  vignetteFade: number;
  vertical: boolean;
  verticalTop: number;
  verticalIn: number;
  verticalOut: number;
  verticalEnd: number;
  well: boolean;
  wellW: number;
  wellH: number;
  wellX: number;
  wellY: number;
  wellClear: number;
  wellSolid: number;
};

function buildLayers(v: LabValues) {
  const layers: string[] = [];
  if (v.vignette) {
    layers.push(
      `radial-gradient(ellipse ${v.vignetteW}% ${v.vignetteH}% at ${v.vignetteX}% ${v.vignetteY}%, black ${v.vignetteSolid}%, transparent ${v.vignetteFade}%)`,
    );
  }
  if (v.vertical) {
    layers.push(
      `linear-gradient(to bottom, transparent ${v.verticalTop}%, black ${v.verticalIn}%, black ${v.verticalOut}%, transparent ${v.verticalEnd}%)`,
    );
  }
  if (v.well) {
    layers.push(
      `radial-gradient(ellipse ${v.wellW}% ${v.wellH}% at ${v.wellX}% ${v.wellY}%, transparent ${v.wellClear}%, black ${v.wellSolid}%)`,
    );
  }
  return layers;
}

function buildClassName(v: LabValues) {
  const layers = buildLayers(v);
  const offset =
    v.offsetTop < 0 ? `-top-[${-v.offsetTop}px]` : `top-[${v.offsetTop}px]`;
  const parts = ["absolute", "inset-x-0", offset, `h-[${v.height}vh]`];
  if (layers.length > 1) parts.push("[mask-composite:intersect]");
  if (layers.length > 0) {
    parts.push(`[mask-image:${layers.join(",").replace(/ /g, "_")}]`);
  }
  return parts.join(" ");
}

function Row({
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
  if (ctrl.type === "boolean") {
    return (
      <div className="flex items-center justify-between gap-3 py-1">
        <Label htmlFor={id} className="text-xs text-muted-foreground">
          {ctrl.label}
        </Label>
        <Switch
          id={id}
          checked={value as boolean}
          onCheckedChange={(next) => onChange(next)}
        />
      </div>
    );
  }

  if (ctrl.type === "select") {
    return (
      <div className="flex items-center justify-between gap-3 py-1">
        <Label htmlFor={id} className="text-xs text-muted-foreground">
          {ctrl.label}
        </Label>
        <NativeSelect
          id={id}
          value={value as string}
          onChange={(event) => onChange(event.target.value)}
          className="h-8 w-28 text-xs"
        >
          {ctrl.options.map((option) => (
            <NativeSelectOption key={option} value={option}>
              {option}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>
    );
  }

  if (ctrl.type === "number" || ctrl.type === "number-input") {
    return (
      <div className="py-1">
        <div className="mb-1.5 flex items-baseline justify-between gap-3">
          <Label htmlFor={id} className="text-xs text-muted-foreground">
            {ctrl.label}
          </Label>
          <span className="font-mono text-xs tabular-nums text-foreground">
            {value as number}
          </span>
        </div>
        <Slider
          id={id}
          value={value as number}
          min={ctrl.min}
          max={ctrl.max}
          step={ctrl.step}
          onValueChange={(next) =>
            onChange(Array.isArray(next) ? next[0] : next)
          }
        />
      </div>
    );
  }

  return null;
}

const GROUP_START = new Set(["offsetTop", "vignette", "vertical", "well"]);

function Panel({
  controls,
  values,
  onChange,
}: {
  controls: ControlConfig;
  values: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      {Object.entries(controls).map(([key, ctrl]) => (
        <div key={key}>
          {GROUP_START.has(key) && (
            <div aria-hidden className="my-3 h-px bg-border" />
          )}
          <Row
            id={`ctrl-${key}`}
            ctrl={ctrl}
            value={values[key]}
            onChange={(value) => onChange(key, value)}
          />
        </div>
      ))}
    </div>
  );
}

export function HeroShaderLab() {
  const [values, setValues] = useState<Record<string, unknown>>(() =>
    getDefaults(CONTROLS),
  );
  const [panel, setPanel] = useState(true);
  const [saved, setSaved] = useState<string | null>(null);
  const [viewport, setViewport] = useState(0);

  useEffect(() => {
    const read = () => setViewport(window.innerHeight);
    read();
    window.addEventListener("resize", read);
    return () => window.removeEventListener("resize", read);
  }, []);

  const v = values as unknown as LabValues;
  const layers = buildLayers(v);
  const className = buildClassName(v);

  const save = async () => {
    const response = await fetch("/api/lab/hero-shader", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        savedAt: new Date().toISOString(),
        viewportHeight: viewport,
        values: v,
        className,
        maskImage: layers.join(", "),
      }),
    });
    const body = (await response.json()) as { path?: string };
    setSaved(body.path ?? "write failed");
  };

  return (
    <div className="min-h-screen bg-background">
      <section className="relative isolate pt-8 pb-12 sm:pt-16 sm:pb-24">
        <div aria-hidden className="absolute inset-0 -z-10">
          <div
            className="absolute inset-x-0"
            style={{
              top: v.offsetTop,
              height: `${v.height}vh`,
              maskImage: layers.length ? layers.join(", ") : undefined,
              maskComposite: layers.length > 1 ? "intersect" : undefined,
            }}
          >
            {v.maskOnly ? (
              <div className="h-full w-full bg-foreground" />
            ) : (
              <RemocnShader
                theme={v.theme === "light" ? "light" : "dark"}
                background={BACKGROUND}
              />
            )}
          </div>
        </div>

        <div className="section">
          <div className="flex flex-col items-center text-center">
            <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1 text-xs text-muted-foreground">
              Introducing SaaS Typography
            </span>
            <h1 className="max-w-3xl text-balance text-3xl font-semibold leading-[1.1] tracking-tight text-foreground sm:text-4xl md:text-5xl">
              You want the video,
              <br className="hidden sm:block" /> not the ordeal.
            </h1>
            <p className="mt-4 max-w-2xl text-balance text-base leading-relaxed text-foreground [text-shadow:0_0_10px_var(--background),0_0_20px_var(--background)] sm:text-lg">
              Describe your product to your AI agent. It builds the demo video
              from ready-made pieces while you watch in the browser.
            </p>
            <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row">
              <Button size="lg" className="rounded-full">
                Make your first video
                <ArrowRight
                  data-icon="inline-end"
                  className="size-4"
                  aria-hidden="true"
                />
              </Button>
              <Button
                variant="secondary"
                size="lg"
                className="rounded-full font-medium"
              >
                See what ships
              </Button>
            </div>
          </div>
        </div>

        <div className="section mt-16">
          <div className="aspect-video w-full rounded-2xl border border-border bg-card" />
        </div>
      </section>

      <div className="fixed bottom-4 left-4 z-50">
        <Button size="sm" variant="secondary" onClick={() => setPanel(!panel)}>
          {panel ? "Hide panel" : "Show panel"}
        </Button>
      </div>

      {panel && (
        <div
          className="fixed inset-y-0 right-0 z-50 overflow-y-auto border-l border-border bg-background/95 p-4 backdrop-blur"
          style={{ width: PANEL_WIDTH }}
        >
          <div className="mb-4 flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">
              Viewport {viewport}px
            </Label>
            <Button size="sm" onClick={save}>
              Save
            </Button>
          </div>

          <Panel
            controls={CONTROLS}
            values={values}
            onChange={(key, value) =>
              setValues((prev) => ({ ...prev, [key]: value }))
            }
          />

          <div className="mt-6">
            <Label className="text-xs text-muted-foreground">className</Label>
            <pre className="mt-2 whitespace-pre-wrap break-all rounded-lg bg-muted p-3 text-[11px] leading-relaxed text-foreground">
              {className}
            </pre>
            {saved && (
              <p className="mt-2 font-mono text-[11px] text-muted-foreground">
                wrote {saved}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
