import { type CountryKey, defaultCountries } from "./countries";

export const xAdsContent = {
  prefix: "Meet",
  product: "Workflow Console",
  command:
    "prepare release v2.4. check the build, run tests in staging, then roll out with a canary.",
  fetching: "Reading release context",
  launchCommand: "Ship it.",
  geography: "Choose an environment",
  campaign: "Release v2.4",
  delivery: "rolling out",
  deliveryDetail: "checks are PASSING, rollback is READY",
  growth: "Less waiting. More shipping.",
  statsLoading: "Reading pipeline metrics",
  statsQuestion: "how is the pipeline doing?",
  followup: "where is the bottleneck?",
  changeCommand: "What should we improve?",
  recommendation: "The test queue is growing — add parallel workers.",
  budgetLabel: "Test workers",
  oldBudget: "2",
  newBudget: "6",
  doubleCommand: "scale to six workers",
  closing: "Keep your work moving",
  terminalTitle: "workflow　~/releases/v2.4",
  chartTitle: "Pipeline throughput · demo runs / hour",
};

export type XAdsContent = typeof xAdsContent;
export type ChartBar = { label: string; value: number; detail: string };
export const xAdsBars: ChartBar[] = [
  { label: "Baseline", value: 24, detail: "24 runs / h" },
  { label: "Cache", value: 48, detail: "48 runs / h" },
  { label: "Parallel", value: 72, detail: "72 runs / h" },
  { label: "Optimized", value: 96, detail: "96 runs / h" },
];

export type TerminalRun = "campaign" | "launched" | "stats";
export type TerminalRow = {
  at: number;
  text: string;
  kind?: "prompt" | "call" | "thought" | "note" | "result";
  highlight?: string;
};

export type Environment = {
  label: string;
  topology: "single" | "parallel" | "cluster" | "canary";
};
export const workflowEnvironments: Environment[] = [
  { label: "Preview", topology: "single" },
  { label: "Staging", topology: "parallel" },
  { label: "Production", topology: "cluster" },
  { label: "Canary", topology: "canary" },
];
export const workflowTools = [
  "Workflow Read Release Plan",
  "Checked in 1.1s",
  "Workflow Run Test Suite",
  "Checked in 1.9s",
  "Workflow Create Canary",
  "Workflow Start Rollout",
  "Checked in 0.1s",
];

export type XAdsMcpProps = {
  productName?: string;
  accentColor?: string;
  backgroundColor?: string;
  content?: Partial<XAdsContent>;
  /** Legacy map override. Defaults now use environment diagrams. */
  countries?: CountryKey[];
  environments?: Environment[];
  tools?: string[];
  bars?: ChartBar[];
  terminalRows?: Partial<Record<TerminalRun, TerminalRow[]>>;
  logoSrc?: string;
  audioSrc?: string;
  volume?: number;
};

export function resolveXAdsProps(props: XAdsMcpProps) {
  // `undefined` from optional Studio fields must not erase concrete defaults.
  const overrides = Object.fromEntries(
    Object.entries(props.content ?? {}).filter(
      ([, value]) => value !== undefined,
    ),
  );
  const content: XAdsContent = { ...xAdsContent, ...overrides };
  if (props.productName !== undefined) content.product = props.productName;
  const countries = props.countries?.filter((key) =>
    defaultCountries.includes(key),
  );
  const bars = props.bars?.filter(
    (bar) => Number.isFinite(bar.value) && bar.value >= 0,
  );
  const environments = props.environments?.filter(
    (item) =>
      item.label.trim() &&
      workflowEnvironments.some((entry) => entry.topology === item.topology),
  );
  const customTools = props.tools?.filter((item) => item.trim());
  return {
    content,
    environments: environments?.length
      ? environments.slice(0, 8)
      : workflowEnvironments,
    useCountries: Boolean(countries?.length && !environments?.length),
    tools: customTools?.length ? customTools.slice(0, 10) : workflowTools,
    accent: props.accentColor?.trim() || "#8ed8f8",
    background: props.backgroundColor?.trim() || "#0e1b2b",
    countries: countries?.length ? countries : defaultCountries,
    bars: bars?.length ? bars.slice(0, 8) : xAdsBars,
    terminalRows: props.terminalRows ?? {},
    logoSrc: props.logoSrc?.trim(),
  };
}

export type XAdsScene = ReturnType<typeof resolveXAdsProps>;
export type SceneProps = { scene: XAdsScene; t: number };

export function terminalContent(
  run: TerminalRun,
  c: XAdsContent,
): TerminalRow[] {
  if (run === "campaign")
    return [
      { at: 0.1, text: c.command, kind: "prompt" },
      { at: 0.22, text: "Checked in 1.2s", kind: "thought" },
      {
        at: 0.4,
        text: 'Call workflow · read_release (version: "v2.4")',
        kind: "call",
      },
      {
        at: 0.55,
        text: "  changes: 12 merged · 0 conflicts",
        kind: "note",
        highlight: "12",
      },
      { at: 0.72, text: "Call workflow · inspect_test_suite", kind: "call" },
      { at: 0.9, text: "  48 checks · 4 parallel groups", kind: "note" },
      {
        at: 1.1,
        text: "All 12 changes are ready. Running the 48 checks in staging,",
        highlight: "12",
      },
      { at: 1.23, text: "then a canary rollout with automatic rollback." },
    ];
  if (run === "launched")
    return [
      { at: 0, text: c.launchCommand, kind: "prompt" },
      {
        at: 0.13,
        text: 'Call workflow · create_release (version: "v2.4")',
        kind: "call",
      },
      {
        at: 0.28,
        text: "  status: READY · checks: PASSING",
        kind: "note",
        highlight: "READY",
      },
      {
        at: 0.42,
        text: 'Call workflow · prepare_environment (name: "Staging")',
        kind: "call",
      },
      { at: 0.6, text: "  checks: 48 passed · errors: 0", kind: "note" },
      {
        at: 0.72,
        text: 'Call workflow · create_canary (traffic: "10%")',
        kind: "call",
      },
      { at: 0.86, text: "Call workflow · start_rollout", kind: "call" },
      {
        at: 1,
        text: '✓ Release live: "v2.4" — healthy',
        kind: "result",
      },
    ];
  return [
    { at: 0.08, text: c.statsQuestion, kind: "prompt" },
    { at: 0.2, text: "Checked in 0.6s", kind: "thought" },
    {
      at: 0.37,
      text: 'Call workflow · get_pipeline_metrics (window: "1h")',
      kind: "call",
    },
    {
      at: 0.58,
      text: "  median build 42s · target under 60s",
      kind: "note",
      highlight: "42s",
    },
    {
      at: 0.77,
      text: "Builds are healthy — median duration is 42s, under your",
      highlight: "42s",
    },
    {
      at: 0.88,
      text: "60s target. Test jobs spend 18s waiting in the queue.",
      highlight: "18s",
    },
    { at: 1.55, text: c.followup, kind: "prompt" },
    { at: 1.65, text: "Checked in 0.4s", kind: "thought" },
    {
      at: 2.0,
      text: "The cache is working. Tests are waiting for free workers.",
    },
    { at: 2.25, text: "Two workers are busy — there’s room to scale." },
  ];
}
