// `bun scripts/customizer-report.mts [--days 30] [--top 25] [--min-people 10] [--out report.md]`
//
// Which props people change in the docs customizer, and what they leave them
// at. Reads `component_customized` events from OpenPanel's Export API with the
// keys in `.env` (NEXT_PUBLIC_OPENPANEL_CLIENT_ID, OPENPANEL_CLIENT_SECRET;
// the client needs read access) and writes a Markdown report.
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { Glob } from "bun";
import {
  type ComponentConfig,
  type ControlConfig,
  resolveControls,
} from "@/lib/customizer-config";
import {
  buildReport,
  type CustomizeEvent,
  renderReport,
} from "@/lib/customizer-report";

const args = new Map<string, string>();
for (let i = 2; i < process.argv.length; i += 2) {
  args.set(process.argv[i].replace(/^--/, ""), process.argv[i + 1] ?? "");
}
const days = Number(args.get("days") ?? 30);
const top = Number(args.get("top") ?? 25);
const minPeople = Number(args.get("min-people") ?? 10);
const out = args.get("out");

const API = (
  process.env.NEXT_PUBLIC_OPENPANEL_API_URL ?? "https://api.openpanel.dev"
).replace(/\/$/, "");
const headers = {
  "openpanel-client-id": process.env.NEXT_PUBLIC_OPENPANEL_CLIENT_ID ?? "",
  "openpanel-client-secret": process.env.OPENPANEL_CLIENT_SECRET ?? "",
};
if (!headers["openpanel-client-id"] || !headers["openpanel-client-secret"]) {
  console.error(
    "Set NEXT_PUBLIC_OPENPANEL_CLIENT_ID and OPENPANEL_CLIENT_SECRET.",
  );
  process.exit(1);
}

type RawEvent = {
  id: string;
  createdAt: string;
  deviceId: string;
  properties?: Record<string, unknown>;
};

async function page(limit: number, n: number): Promise<RawEvent[]> {
  const url = `${API}/export/events?projectId=remocn&event=component_customized&includes=properties&limit=${limit}&page=${n}`;
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`OpenPanel export page ${n}: ${res.status}`);
  return ((await res.json()) as { data: RawEvent[] }).data;
}

// Newest first. The export's first page stops at the newest ~91 events
// whatever the limit, while later pages keep their offsets, so the first
// thousand come in pages of 90 and the rest in pages of 1000.
const since = new Date(Date.now() - days * 86_400_000).toISOString();
const seen = new Map<string, RawEvent>();
let done = false;
const take = (rows: RawEvent[]) => {
  for (const row of rows) {
    if (row.createdAt < since) done = true;
    else seen.set(row.id, row);
  }
  return rows.length;
};
for (let n = 1; n <= 12 && !done; n += 1) {
  if (take(await page(90, n)) === 0) done = true;
}
for (let n = 2; !done; n += 1) {
  if (take(await page(1000, n)) === 0) done = true;
}

const events: CustomizeEvent[] = [...seen.values()].map((row) => {
  const props = row.properties ?? {};
  const query: Record<string, string> = {};
  for (const [key, value] of Object.entries(props)) {
    if (key.startsWith("__query.")) query[key.slice(8)] = String(value);
  }
  return {
    id: row.id,
    createdAt: row.createdAt,
    deviceId: row.deviceId,
    component: String(props.component ?? ""),
    prop: String(props.prop ?? ""),
    source: typeof props.source === "string" ? props.source : undefined,
    query,
  };
});

const configs: Record<string, ControlConfig> = {};
for (const file of new Glob("registry/*/*/config.ts").scanSync(".")) {
  const mod = await import(resolve(file));
  const config = Object.values(mod).find(
    (v) => v && typeof v === "object" && "controls" in (v as object),
  ) as ComponentConfig | undefined;
  const name = file.split("/").at(-2);
  if (config && name)
    configs[name] = resolveControls(name, config.controls, config.lists);
}

const markdown = renderReport(buildReport(events, configs, { minPeople }), {
  top,
  minPeople,
});
if (out) {
  writeFileSync(out, markdown);
  console.error(`${events.length} events → ${out}`);
} else {
  console.log(markdown);
}
