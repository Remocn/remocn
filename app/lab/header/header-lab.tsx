"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { GitHubIcon } from "@/app/(home)/components/github-icon";
import { HeaderLogo } from "@/app/(home)/components/header-parts";
import { StarsButton } from "@/app/(home)/components/stars-button";
import { ThemeToggle } from "@/app/(home)/components/theme-toggle";
import { ComponentCustomizer } from "@/components/docs/component-customizer";
import { SlidingHighlight } from "@/components/sliding-highlight";
import { Button, buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { NAV_LINKS, type NavLink } from "@/config/site";
import { useScroll } from "@/hooks/use-scroll";
import { type ControlConfig, getDefaults } from "@/lib/customizer-config";
import { cn } from "@/lib/utils";

const PANEL_WIDTH = 340;

const CONTROLS: ControlConfig = {
  mode: {
    type: "select",
    default: "island",
    options: ["island", "bar"],
    label: "Mode",
  },
  heightTop: {
    type: "number",
    default: 64,
    min: 52,
    max: 80,
    step: 2,
    label: "Height at top",
  },
  heightScrolled: {
    type: "number",
    default: 56,
    min: 44,
    max: 72,
    step: 2,
    label: "Height scrolled",
  },
  radius: {
    type: "number",
    default: 24,
    min: 0,
    max: 32,
    step: 2,
    label: "Radius",
  },
  fullRadius: { type: "boolean", default: false, label: "Pill radius" },
  bgOpacity: {
    type: "number",
    default: 80,
    min: 0,
    max: 100,
    step: 5,
    label: "Background",
  },
  blur: {
    type: "number",
    default: 24,
    min: 0,
    max: 32,
    step: 2,
    label: "Blur",
  },
  borderOpacity: {
    type: "number",
    default: 100,
    min: 0,
    max: 100,
    step: 5,
    label: "Border",
  },
  floatGap: {
    type: "number",
    default: 12,
    min: 0,
    max: 24,
    step: 2,
    label: "Float gap",
  },
  duration: {
    type: "number",
    default: 300,
    min: 100,
    max: 600,
    step: 50,
    label: "Duration",
  },
  navMuted: { type: "boolean", default: false, label: "Muted nav" },
  cta: {
    type: "select",
    default: "none",
    options: ["none", "outline", "filled"],
    label: "CTA",
  },
  githubStyle: {
    type: "select",
    default: "ghost",
    options: ["ghost", "outline"],
    label: "GitHub button",
  },
  showStars: { type: "boolean", default: false, label: "Stars button" },
};

type LabConfig = {
  mode: "island" | "bar";
  heightTop: number;
  heightScrolled: number;
  radius: number;
  fullRadius: boolean;
  bgOpacity: number;
  blur: number;
  borderOpacity: number;
  floatGap: number;
  duration: number;
  navMuted: boolean;
  cta: "none" | "outline" | "filled";
  githubStyle: "ghost" | "outline";
  showStars: boolean;
};

type SavedEntry = {
  id: number;
  name: string;
  values: Record<string, unknown>;
};

const STORAGE_KEY = "remocn-lab-header";

function LabNav({ links, muted }: { links: NavLink[]; muted: boolean }) {
  const navRef = useRef<HTMLElement>(null);
  const [highlight, setHighlight] = useState<{
    left: number;
    width: number;
  } | null>(null);

  const moveTo = (el: HTMLElement | null) => {
    const nav = navRef.current;
    if (!nav || !el) return;
    const navRect = nav.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    setHighlight({ left: elRect.left - navRect.left, width: elRect.width });
  };

  return (
    <nav
      ref={navRef}
      onMouseLeave={() => setHighlight(null)}
      className="relative hidden items-center gap-1 sm:flex"
    >
      <SlidingHighlight rect={highlight} />
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          onClick={(event) => event.preventDefault()}
          onMouseEnter={(event) => moveTo(event.currentTarget)}
          onFocus={(event) => moveTo(event.currentTarget)}
          className={cn(
            "relative rounded-full px-3 py-2 text-sm font-medium focus-visible:outline-none",
            muted
              ? "text-muted-foreground transition-colors hover:text-foreground"
              : "text-foreground",
          )}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}

function LabGithubButton({ style }: { style: "ghost" | "outline" }) {
  return (
    <span
      className={cn(
        "inline-flex h-9 cursor-pointer items-center gap-2 rounded-full px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
        style === "outline" && "border border-border",
      )}
    >
      <GitHubIcon className="size-4" />
      <span className="inline-flex items-center gap-1 tabular-nums text-foreground">
        2.4k
      </span>
    </span>
  );
}

function LabHeader({ cfg, active }: { cfg: LabConfig; active: boolean }) {
  const island = cfg.mode === "island";
  const height = active ? cfg.heightScrolled : cfg.heightTop;
  const radius = cfg.fullRadius ? 999 : cfg.radius;
  const background = active
    ? `color-mix(in oklab, var(--background) ${cfg.bgOpacity}%, transparent)`
    : "transparent";
  const borderColor = active
    ? `color-mix(in oklab, var(--border) ${cfg.borderOpacity}%, transparent)`
    : "transparent";
  const backdropFilter = `blur(${active ? cfg.blur : 0}px)`;
  const transition = `height ${cfg.duration}ms ease, background-color ${cfg.duration}ms ease, border-color ${cfg.duration}ms ease, border-radius ${cfg.duration}ms ease, backdrop-filter ${cfg.duration}ms ease`;

  const row = (
    <>
      <HeaderLogo />
      <LabNav links={NAV_LINKS} muted={cfg.navMuted} />
      <div className="flex items-center gap-2">
        {cfg.showStars && (
          <StarsButton onClick={(event) => event.preventDefault()} />
        )}
        <LabGithubButton style={cfg.githubStyle} />
        <ThemeToggle />
        {cfg.cta !== "none" && (
          <span
            className={cn(
              buttonVariants({
                variant: cfg.cta === "filled" ? "default" : "outline",
                size: "sm",
              }),
              "h-9 cursor-pointer rounded-full px-4",
            )}
          >
            Get started
          </span>
        )}
      </div>
    </>
  );

  return (
    <header className="fixed top-0 left-0 z-40" style={{ right: PANEL_WIDTH }}>
      {island ? (
        <div
          className="section"
          style={{ paddingTop: cfg.floatGap, paddingBottom: cfg.floatGap }}
        >
          <div
            className="flex w-full items-center justify-between px-4 sm:px-6"
            style={{
              height,
              borderRadius: radius,
              backgroundColor: background,
              border: `1px solid ${borderColor}`,
              backdropFilter,
              WebkitBackdropFilter: backdropFilter,
              transition,
            }}
          >
            {row}
          </div>
        </div>
      ) : (
        <div
          style={{
            height,
            backgroundColor: background,
            borderBottom: `1px solid ${borderColor}`,
            backdropFilter,
            WebkitBackdropFilter: backdropFilter,
            transition,
          }}
        >
          <div className="section flex h-full items-center justify-between">
            {row}
          </div>
        </div>
      )}
    </header>
  );
}

export function HeaderLab() {
  const scrolled = useScroll();
  const [values, setValues] = useState<Record<string, unknown>>(() =>
    getDefaults(CONTROLS),
  );
  const [forceScrolled, setForceScrolled] = useState(false);
  const [saves, setSaves] = useState<SavedEntry[]>([]);
  const [savedNote, setSavedNote] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setSaves(JSON.parse(raw) as SavedEntry[]);
    } catch {}
  }, []);

  const persist = (next: SavedEntry[]) => {
    setSaves(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {}
  };

  const save = async () => {
    const entry: SavedEntry = {
      id: Date.now(),
      name: `Save ${saves.length + 1}`,
      values,
    };
    persist([...saves, entry]);
    try {
      await navigator.clipboard.writeText(JSON.stringify(values, null, 2));
    } catch {}
    setSavedNote(true);
    setTimeout(() => setSavedNote(false), 1500);
  };

  const cfg = values as unknown as LabConfig;
  const active = scrolled || forceScrolled;
  const spacer =
    cfg.mode === "island" ? cfg.heightTop + cfg.floatGap * 2 : cfg.heightTop;

  return (
    <div className="min-h-screen bg-background">
      <LabHeader cfg={cfg} active={active} />
      <div style={{ height: spacer }} />

      <main style={{ paddingRight: PANEL_WIDTH }}>
        <div className="section">
          <div className="flex min-h-[70vh] flex-col items-start justify-center gap-6">
            <h1 className="max-w-2xl text-5xl font-semibold tracking-tight text-foreground">
              Make a product demo video with your AI agent
            </h1>
            <p className="max-w-xl text-lg text-muted-foreground">
              Fake landing page. Scroll to watch the header morph, tweak the
              knobs on the right, save when it clicks.
            </p>
            <div className="flex gap-3">
              <span
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "cursor-pointer rounded-full",
                )}
              >
                Get started
              </span>
              <span
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "cursor-pointer rounded-full",
                )}
              >
                Browse components
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-8 pb-24">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="flex h-[70vh] items-center justify-center rounded-3xl bg-muted/50 text-sm text-muted-foreground"
              >
                Section {n}
              </div>
            ))}
          </div>
        </div>
      </main>

      <aside
        className="fixed inset-y-0 right-0 z-50 overflow-y-auto border-l border-border bg-background p-4"
        style={{ width: PANEL_WIDTH }}
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-foreground">
            Header lab
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setValues(getDefaults(CONTROLS))}
            >
              Reset
            </Button>
            <Button size="sm" onClick={save}>
              {savedNote ? "Copied" : "Save"}
            </Button>
          </div>
        </div>

        <label
          htmlFor="force-scrolled"
          className="mt-4 flex h-9 items-center justify-between rounded-xl control-surface px-3 text-sm"
        >
          <span className="font-medium text-muted-foreground">
            Force scrolled state
          </span>
          <Switch
            id="force-scrolled"
            checked={forceScrolled}
            onCheckedChange={setForceScrolled}
          />
        </label>

        <div className="mt-3 [&>div]:grid-cols-1!">
          <ComponentCustomizer
            controls={CONTROLS}
            values={values}
            onChange={(key, value) =>
              setValues((prev) => ({ ...prev, [key]: value }))
            }
          />
        </div>

        {saves.length > 0 && (
          <div className="mt-6">
            <Label className="text-xs text-muted-foreground">Saved</Label>
            <div className="mt-2 flex flex-col gap-2">
              {saves.map((entry) => (
                <div
                  key={entry.id}
                  className="flex h-9 items-center justify-between rounded-xl control-surface px-3 text-sm"
                >
                  <button
                    type="button"
                    className="flex-1 text-left font-medium text-foreground"
                    onClick={() => setValues(entry.values)}
                  >
                    {entry.name}
                  </button>
                  <button
                    type="button"
                    aria-label={`Delete ${entry.name}`}
                    className="text-muted-foreground hover:text-foreground"
                    onClick={() =>
                      persist(saves.filter((s) => s.id !== entry.id))
                    }
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
