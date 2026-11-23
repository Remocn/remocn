import {
  type ControlConfig,
  type ControlType,
  customizerUrlKey,
} from "@/lib/customizer-config";

/**
 * Which props people change in the docs customizer, and what they change
 * them to. Built from `component_customized` events: OpenPanel keeps the
 * page's query string with each event, and the customizer keeps every
 * non-default value in it, so an event also carries the values at that
 * moment. Typed text never leaves this module: text props report counts,
 * not values.
 */

export type CustomizeEvent = {
  id: string;
  createdAt: string;
  deviceId: string;
  component: string;
  prop: string;
  source?: string;
  /** The page's query params when the event was sent. */
  query: Record<string, string>;
};

export type ValueShare = { value: string; people: number; share: number };

export type PropStats = {
  prop: string;
  label: string;
  type: ControlType["type"];
  people: number;
  changes: number;
  defaultValue: string;
  /** Where people left it: their last value, most common first. Empty for text. */
  values: ValueShare[];
};

export type ComponentStats = {
  component: string;
  people: number;
  changes: number;
  props: PropStats[];
  untouched: string[];
};

export type Reconsider = {
  component: string;
  prop: string;
  label: string;
  defaultValue: string;
  picked: string;
  share: number;
  people: number;
};

export type CustomizerReport = {
  from: string;
  to: string;
  changes: number;
  people: number;
  components: ComponentStats[];
  reconsider: Reconsider[];
  byType: { type: string; people: number; changes: number }[];
  bySource: { source: string; changes: number }[];
};

const valueAt = (
  event: CustomizeEvent,
  component: string,
  prop: string,
  ctrl: ControlType,
) => event.query[customizerUrlKey(component, prop)] ?? String(ctrl.default);

export function buildReport(
  events: CustomizeEvent[],
  configs: Record<string, ControlConfig>,
  options: { minPeople?: number; pickedShare?: number } = {},
): CustomizerReport {
  const minPeople = options.minPeople ?? 10;
  const pickedShare = options.pickedShare ?? 0.5;
  const sorted = [...events].sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt),
  );

  const byComponent = new Map<string, CustomizeEvent[]>();
  for (const event of sorted) {
    if (!configs[event.component]?.[event.prop]) continue;
    const list = byComponent.get(event.component) ?? [];
    list.push(event);
    byComponent.set(event.component, list);
  }

  const components: ComponentStats[] = [];
  const reconsider: Reconsider[] = [];
  const types = new Map<string, { people: Set<string>; changes: number }>();
  const sources = new Map<string, number>();

  for (const [component, list] of byComponent) {
    const controls = configs[component];
    const props: PropStats[] = [];
    for (const [prop, ctrl] of Object.entries(controls)) {
      const own = list.filter((event) => event.prop === prop);
      if (own.length === 0) continue;
      // Later events overwrite earlier ones: a person's last value stays.
      const last = new Map<string, string>();
      for (const event of own) {
        last.set(event.deviceId, valueAt(event, component, prop, ctrl));
      }
      const counts = new Map<string, number>();
      for (const value of last.values()) {
        counts.set(value, (counts.get(value) ?? 0) + 1);
      }
      const values =
        ctrl.type === "text"
          ? []
          : [...counts]
              .map(([value, people]) => ({
                value,
                people,
                share: people / last.size,
              }))
              .sort((a, b) => b.people - a.people);
      const stats: PropStats = {
        prop,
        label: ctrl.label,
        type: ctrl.type,
        people: last.size,
        changes: own.length,
        defaultValue: String(ctrl.default),
        values,
      };
      props.push(stats);

      const top = values[0];
      if (
        top &&
        last.size >= minPeople &&
        top.value !== stats.defaultValue &&
        top.share >= pickedShare
      ) {
        reconsider.push({
          component,
          prop,
          label: ctrl.label,
          defaultValue: stats.defaultValue,
          picked: top.value,
          share: top.share,
          people: last.size,
        });
      }

      const type = types.get(ctrl.type) ?? { people: new Set(), changes: 0 };
      for (const device of last.keys())
        type.people.add(`${component}:${device}`);
      type.changes += own.length;
      types.set(ctrl.type, type);
    }
    for (const event of list) {
      const source = event.source ?? "unknown";
      sources.set(source, (sources.get(source) ?? 0) + 1);
    }
    props.sort((a, b) => b.people - a.people);
    components.push({
      component,
      people: new Set(list.map((event) => event.deviceId)).size,
      changes: list.length,
      props,
      untouched: Object.keys(controls).filter(
        (prop) => !props.some((stats) => stats.prop === prop),
      ),
    });
  }

  components.sort((a, b) => b.people - a.people);
  reconsider.sort((a, b) => b.people * b.share - a.people * a.share);
  const counted = components.reduce((sum, c) => sum + c.changes, 0);

  return {
    from: sorted[0]?.createdAt ?? "",
    to: sorted.at(-1)?.createdAt ?? "",
    changes: counted,
    people: new Set(
      [...byComponent.values()].flat().map((event) => event.deviceId),
    ).size,
    components,
    reconsider,
    byType: [...types]
      .map(([type, { people, changes }]) => ({
        type,
        people: people.size,
        changes,
      }))
      .sort((a, b) => b.people - a.people),
    bySource: [...sources]
      .map(([source, changes]) => ({ source, changes }))
      .sort((a, b) => b.changes - a.changes),
  };
}

const pct = (share: number) => `${Math.round(share * 100)}%`;
const code = (value: string) => `\`${value.replace(/`/g, "'")}\``;

export function renderReport(
  report: CustomizerReport,
  options: { top?: number; minPeople?: number } = {},
): string {
  const top = options.top ?? 25;
  const minPeople = options.minPeople ?? 10;
  const day = (iso: string) => iso.slice(0, 10);
  const lines = [
    "# Customizer report",
    "",
    `${day(report.from)} – ${day(report.to)}: ${report.changes} prop changes by ${report.people} people on ${report.components.length} components.`,
    "",
    "A person is a device. Values are where each person left a prop, so a drag through ten values counts once.",
    "",
    `## Most customized components (top ${top})`,
    "",
    "| Component | People | Changes | Props they change most |",
    "|---|---:|---:|---|",
  ];
  for (const c of report.components.slice(0, top)) {
    const props = c.props
      .slice(0, 3)
      .map((p) => `${p.label} (${pct(p.people / c.people)})`)
      .join(", ");
    lines.push(`| ${c.component} | ${c.people} | ${c.changes} | ${props} |`);
  }

  lines.push(
    "",
    "## Defaults to reconsider",
    "",
    `Props that at least ${minPeople} people changed, where most of them left the same value and it isn't the default.`,
    "",
  );
  if (report.reconsider.length === 0) {
    lines.push("None yet.");
  } else {
    lines.push(
      "| Component | Prop | Default | Most left at | Share | People |",
      "|---|---|---|---|---:|---:|",
    );
    for (const r of report.reconsider.slice(0, top)) {
      lines.push(
        `| ${r.component} | ${r.label} | ${code(r.defaultValue)} | ${code(r.picked)} | ${pct(r.share)} | ${r.people} |`,
      );
    }
  }

  const quiet = report.components.filter(
    (c) => c.people >= minPeople && c.untouched.length > 0,
  );
  lines.push(
    "",
    "## Props nobody changed",
    "",
    `On components at least ${minPeople} people customized. Candidates to move down or drop from the panel.`,
    "",
  );
  if (quiet.length === 0) {
    lines.push("None.");
  } else {
    lines.push("| Component | People | Untouched |", "|---|---:|---|");
    for (const c of quiet.slice(0, top)) {
      lines.push(
        `| ${c.component} | ${c.people} | ${c.untouched.join(", ")} |`,
      );
    }
  }

  lines.push(
    "",
    "## By control type",
    "",
    "| Type | People × component | Changes |",
    "|---|---:|---:|",
    ...report.byType.map((t) => `| ${t.type} | ${t.people} | ${t.changes} |`),
    "",
    "## Who made the change",
    "",
    "`unknown` is every event sent before the source was tracked.",
    "",
    "| Source | Changes |",
    "|---|---:|",
    ...report.bySource.map((s) => `| ${s.source} | ${s.changes} |`),
    "",
  );
  return lines.join("\n");
}
