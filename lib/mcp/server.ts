import "server-only";

import { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import { VIBES } from "@/lib/docs-schema";
import { SITE_URL } from "@/lib/get-llm-text";
import { readAnatomy, readArchetypeRecipe } from "@/lib/mcp/archetype-files";
import {
  ARCHETYPES,
  type Archetype,
  extractQualityBar,
  type PlanBeat,
  parseRecipe,
  pickArchetype,
} from "@/lib/mcp/archetypes";
import { getCatalog, getComponentMarkdown } from "@/lib/mcp/catalog";
import {
  embedBaseUrl,
  embedUrl,
  MCP_APP_MIME_TYPE,
  PREVIEW_RESOURCE_URI,
} from "@/lib/mcp/config";
import {
  type ComponentRecord,
  closestNames,
  installCommand,
  MAX_LIMIT,
  normalizeName,
  searchComponents,
} from "@/lib/mcp/search";
import { PREVIEW_WIDGET_HTML } from "@/lib/mcp/widget";
import { previewManifest } from "@/registry/__manifest__";

const SERVER_INFO = { name: "remocn", version: "1.0.0" };

const INSTRUCTIONS = `remocn is a shadcn registry of Remotion video components. Find components with search_components, read one with get_component before writing code against it, and use plan_video to turn a brief into a beat-by-beat storyboard. Install with \`npx shadcn@latest add @remocn/<name>\`. Full index: ${SITE_URL}/llms-components.txt`;

const MAX_PROPS_JSON = 4000;
// The endpoint is public and unauthenticated; every text input is bounded so
// one request can't hold the event loop.
const MAX_NAME = 200;
const MAX_QUERY = 500;
const MAX_BRIEF = 2000;
const MAX_SUGGEST_INPUT = 64;

const READ_ONLY = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
} as const;

// The title goes in the annotations too: the directory and clients on the
// 2025-03-26 spec read `annotations.title`, newer ones the tool's own `title`.
function readOnly(title: string) {
  return { ...READ_ONLY, title };
}

type TextResult = {
  content: { type: "text"; text: string }[];
  structuredContent?: Record<string, unknown>;
  isError?: boolean;
};

function text(body: string, structuredContent?: Record<string, unknown>) {
  const result: TextResult = { content: [{ type: "text", text: body }] };
  if (structuredContent) result.structuredContent = structuredContent;
  return result;
}

function errorText(body: string): TextResult {
  return { content: [{ type: "text", text: body }], isError: true };
}

function lengthLabel(length: ComponentRecord["length"]): string {
  if (length === undefined) return "—";
  return typeof length === "number" ? `${length}f` : length;
}

function htmlDocsUrl(record: ComponentRecord): string {
  return record.docs.replace(/\.md$/, "");
}

/** Resolve user input (name, `@remocn/name`, docs path, or title) to a documented component. */
function resolveComponent(input: string): ComponentRecord | undefined {
  const { byName, records } = getCatalog();
  const exact = byName.get(input.trim());
  if (exact) return exact;
  const normalized = normalizeName(input);
  const byNormalized = byName.get(normalized);
  if (byNormalized) return byNormalized;
  const lowered = input.trim().toLowerCase();
  return records.find((r) => r.title.toLowerCase() === lowered);
}

function unknownComponent(input: string): TextResult {
  const { records, registry } = getCatalog();
  const normalized = normalizeName(input);
  const registryOnly = registry.get(normalized);
  if (registryOnly) {
    const hint =
      registryOnly.tier === "remocn-icons"
        ? `Icons are documented as a gallery: ${SITE_URL}/docs/icons/gallery.md`
        : "It is a shared library pulled in by other components, not used on its own.";
    return text(
      `\`${normalized}\` is a registry item without its own docs page. ${hint}\nInstall: \`${installCommand(normalized)}\``,
    );
  }
  // Edit distance against every name is quadratic in the input; a name this
  // long is no typo of a component, so skip the suggestions.
  const matches =
    input.length > MAX_SUGGEST_INPUT
      ? []
      : closestNames(
          records.map((r) => r.name),
          input,
        );
  const suggestion = matches.length
    ? `Did you mean: ${matches.map((m) => `\`${m}\``).join(", ")}?`
    : "Try search_components to find it by what it does.";
  return errorText(`No remocn component named "${input}". ${suggestion}`);
}

function formatRow(r: ComponentRecord): string {
  const facts = [r.section, r.vibe, lengthLabel(r.length), r.tier]
    .filter(Boolean)
    .join(" · ");
  const lines = [`- \`${r.name}\` — ${r.title} (${facts})`];
  if (r.useWhen[0]) lines.push(`  Use: ${r.useWhen[0]}`);
  if (r.avoidWhen[0]) lines.push(`  Avoid: ${r.avoidWhen[0]}`);
  lines.push(`  Docs: ${r.docs} · Install: \`${r.install}\``);
  return lines.join("\n");
}

function compactRow(r: ComponentRecord) {
  return {
    name: r.name,
    title: r.title,
    section: r.section,
    docs: r.docs,
    vibe: r.vibe ?? null,
    length: r.length ?? null,
    tier: r.tier ?? null,
    useWhen: r.useWhen.slice(0, 2),
    avoidWhen: r.avoidWhen.slice(0, 2),
    install: r.install,
  };
}

function previewFor(name: string, props?: Record<string, unknown>) {
  const entry = previewManifest[name];
  if (!entry) return undefined;
  return {
    name,
    embedUrl: embedUrl(name, props),
    durationInFrames: entry.durationInFrames,
    fps: entry.fps,
    width: entry.compositionWidth,
    height: entry.compositionHeight,
  };
}

function beatOptions(beat: PlanBeat) {
  return beat.components.map((name) => ({
    name,
    embedUrl: previewManifest[name] ? embedUrl(name) : null,
    docs: getCatalog().byName.get(name)?.docs ?? null,
  }));
}

function formatFrames(beat: PlanBeat): string {
  return beat.startFrame !== undefined && beat.endFrame !== undefined
    ? ` (${beat.startFrame}–${beat.endFrame}f)`
    : "";
}

/**
 * `_meta.ui` for the view (McpUiResourceMeta in ext-apps). Hosts read it from
 * the `resources/read` content item, falling back to the `resources/list`
 * entry, so it is set on both. The view only nests iframes of the embed
 * origin; it loads no remote scripts and makes no network calls itself.
 */
function previewResourceMeta() {
  return {
    ui: {
      csp: {
        frameDomains: [embedBaseUrl()],
        resourceDomains: [],
        connectDomains: [],
      },
      permissions: { clipboardWrite: {} },
      prefersBorder: false,
    },
  };
}

export function createRemocnMcpServer(): McpServer {
  const server = new McpServer(SERVER_INFO, { instructions: INSTRUCTIONS });

  server.registerTool(
    "search_components",
    {
      title: "Search remocn components",
      description:
        "Search remocn Remotion components by what they do. Returns name, docs .md URL, vibe, length (frames @30fps), use/avoid notes and install command.",
      inputSchema: z.object({
        query: z
          .string()
          .max(MAX_QUERY)
          .describe("What the component should do, e.g. 'typewriter headline'"),
        vibe: z.enum(VIBES).optional().describe("Tonal tag to match the brand"),
        maxLength: z
          .number()
          .int()
          .positive()
          .optional()
          .describe("Max motion length in frames @30fps"),
        limit: z.number().int().min(1).max(MAX_LIMIT).optional(),
      }),
      annotations: readOnly("Search remocn components"),
    },
    async ({ query, vibe, maxLength, limit }) => {
      const results = searchComponents(getCatalog().records, {
        query,
        vibe,
        maxLength,
        limit,
      });
      const filters = [
        vibe && `vibe=${vibe}`,
        maxLength !== undefined && `maxLength=${maxLength}f`,
      ]
        .filter(Boolean)
        .join(", ");
      if (results.length === 0) {
        return text(
          `No components match "${query}"${filters ? ` (${filters})` : ""}. Try fewer words${filters ? " or drop the filters" : ""}. Vibes: ${VIBES.join(", ")}. Full index: ${SITE_URL}/llms-components.txt`,
          { results: [] },
        );
      }
      const header = `${results.length} remocn components for "${query}"${filters ? ` (${filters})` : ""}. Lengths are frames of motion @30fps — a floor for the Sequence, add hold on top.`;
      return text(`${header}\n\n${results.map(formatRow).join("\n")}`, {
        results: results.map(compactRow),
      });
    },
  );

  server.registerTool(
    "get_component",
    {
      title: "Get a remocn component's docs",
      description:
        "Full markdown docs for one remocn component: props, usage example, use/avoid notes and install command.",
      inputSchema: z.object({
        name: z
          .string()
          .max(MAX_NAME)
          .describe("Component name, e.g. 'kinetic-center-build'"),
      }),
      annotations: readOnly("Get a remocn component's docs"),
    },
    async ({ name }) => {
      const record = resolveComponent(name);
      if (!record) return unknownComponent(name);
      const markdown = await getComponentMarkdown(record.name);
      if (!markdown) return unknownComponent(name);
      const deps = getCatalog().registry.get(record.name)?.deps ?? [];
      const depsLine = deps.length
        ? `\n\nRegistry dependencies (installed automatically): ${deps.map((d) => `\`${d}\``).join(", ")}`
        : "";
      return text(`${markdown}${depsLine}`);
    },
  );

  server.registerTool(
    "plan_video",
    {
      title: "Plan a remocn video",
      description:
        "Turn a video brief into a storyboard: picks an archetype, returns its recipe and a beat list with suggested remocn components per beat.",
      inputSchema: z.object({
        brief: z
          .string()
          .min(1)
          .max(MAX_BRIEF)
          .describe("What the video is about, e.g. 'launch video for our CLI'"),
        archetype: z
          .enum(ARCHETYPES)
          .optional()
          .describe("Force an archetype instead of picking by keywords"),
        durationSeconds: z
          .number()
          .positive()
          .max(600)
          .optional()
          .describe("Target length; picks the closest recipe variant"),
      }),
      annotations: readOnly("Plan a remocn video"),
      _meta: { ui: { resourceUri: PREVIEW_RESOURCE_URI } },
    },
    async ({ brief, archetype, durationSeconds }) => {
      const pick = archetype
        ? { archetype, matched: [] as string[], fallback: false }
        : pickArchetype(brief);
      const chosen: Archetype = pick.archetype;
      const recipe = readArchetypeRecipe(chosen);
      if (!recipe) {
        return errorText(
          `The ${chosen} recipe is not available on this server. Use search_components and the index at ${SITE_URL}/llms-components.txt instead.`,
        );
      }

      const catalog = getCatalog();
      const plan = parseRecipe(
        recipe,
        catalog.registry.keys(),
        durationSeconds,
      );
      const beats = plan.beats.map((beat) => {
        const primary = beat.components.find((n) => previewManifest[n]);
        return {
          ...beat,
          preview: primary ? previewFor(primary) : null,
          options: beatOptions(beat),
        };
      });
      const picked = [
        ...new Set([
          ...beats.flatMap((b) => (b.preview ? [b.preview.name] : [])),
          ...plan.transitions.slice(0, 1),
        ]),
      ];
      const install = picked.length
        ? `npx shadcn@latest add ${picked.map((n) => `@remocn/${n}`).join(" ")}`
        : "";
      const prompts = {
        claudeCode: `/remocn:video ${brief}`,
        generic: `Build a ${chosen} video in this Remotion project with remocn components (${SITE_URL}/llms.txt): ${brief}`,
      };

      const why = archetype
        ? "requested"
        : pick.fallback
          ? "default — no archetype keywords matched; pass `archetype` to override"
          : `matched: ${pick.matched.join(", ")}`;
      const lines: string[] = [
        `# Video plan: ${chosen} (${why})`,
        "",
        `Brief: ${brief}`,
        `Recipe default duration: ${plan.meta.defaultduration ?? "see recipe"}${plan.variant ? ` · variant: ${plan.variant}` : ""}${plan.totalFrames ? ` · beats total ${plan.totalFrames}f` : ""}`,
        "",
        "## Beats",
        "The first component of each beat is the suggested pick; the rest are recipe alternatives.",
        "",
      ];
      beats.forEach((beat, i) => {
        lines.push(`${i + 1}. **${beat.name}**${formatFrames(beat)}`);
        if (beat.what) lines.push(`   ${beat.what}`);
        if (beat.components.length)
          lines.push(
            `   Components: ${beat.components.map((c) => `\`${c}\``).join(", ")}`,
          );
        if (beat.buildNew.length)
          lines.push(
            `   Build new (not in catalog): ${beat.buildNew.map((c) => `\`${c}\``).join(", ")}`,
          );
      });
      if (plan.transitions.length)
        lines.push(
          "",
          `Transitions: ${plan.transitions.map((c) => `\`${c}\``).join(", ")}`,
        );
      if (plan.extras.length) {
        lines.push("", "Optional:");
        for (const extra of plan.extras) {
          const parts = [
            ...extra.components.map((c) => `\`${c}\``),
            ...extra.buildNew.map((c) => `build \`${c}\``),
          ];
          lines.push(
            `- ${extra.label}${parts.length ? `: ${parts.join(", ")}` : ""}`,
          );
        }
      }
      for (const note of plan.notes) lines.push("", `Note: ${note}`);
      if (install) lines.push("", "## Install", "", `\`${install}\``);
      lines.push(
        "",
        "## Next step",
        "",
        `Claude Code with the remocn plugin: \`${prompts.claudeCode}\``,
        `Other agents: ${prompts.generic}`,
        "Read each component's docs (get_component) before writing code against its props.",
        "",
        "---",
        "",
        `## Recipe: ${chosen} (authoritative — follow it over the summary above)`,
        "",
        recipe.trim(),
      );
      const anatomy = readAnatomy();
      const qualityBar = anatomy ? extractQualityBar(anatomy) : undefined;
      if (qualityBar)
        lines.push(
          "",
          "---",
          "",
          "## Quality bar (from anatomy.md)",
          "",
          qualityBar,
        );

      return text(lines.join("\n"), {
        kind: "plan",
        brief,
        archetype: chosen,
        archetypeReason: why,
        variant: plan.variant ?? null,
        defaultDuration: plan.meta.defaultduration ?? null,
        totalFrames: plan.totalFrames ?? null,
        beats,
        transitions: plan.transitions,
        extras: plan.extras,
        notes: plan.notes,
        install,
        prompts,
      });
    },
  );

  server.registerTool(
    "preview_component",
    {
      title: "Preview a remocn component",
      description:
        "Live in-chat preview of a remocn component with optional props. Also returns its docs URL and install command.",
      inputSchema: z.object({
        name: z
          .string()
          .max(MAX_NAME)
          .describe("Component name, e.g. 'kinetic-center-build'"),
        props: z
          .record(z.string(), z.unknown())
          .optional()
          .describe("Props merged over the component's demo defaults"),
      }),
      annotations: readOnly("Preview a remocn component"),
      _meta: { ui: { resourceUri: PREVIEW_RESOURCE_URI } },
    },
    async ({ name, props }) => {
      const record = resolveComponent(name);
      if (!record) return unknownComponent(name);
      if (props && JSON.stringify(props).length > MAX_PROPS_JSON) {
        return errorText(
          `props is too large to preview (max ${MAX_PROPS_JSON} chars of JSON).`,
        );
      }
      const preview = previewFor(record.name, props);
      const docsPage = htmlDocsUrl(record);
      if (!preview) {
        return text(
          `\`${record.name}\` has no live preview. Docs: ${record.docs}\nInstall: \`${record.install}\``,
        );
      }
      return text(
        [
          `Live preview of \`${record.name}\` (${record.title}): ${preview.embedUrl}`,
          `${preview.durationInFrames}f @ ${preview.fps}fps, ${preview.width}×${preview.height}${props ? ", custom props applied over demo defaults" : ""}.`,
          `Docs: ${record.docs}`,
          `Install: \`${record.install}\``,
        ].join("\n"),
        {
          kind: "preview",
          ...preview,
          title: record.title,
          docs: record.docs,
          docsPage,
          install: record.install,
          props: props ?? null,
        },
      );
    },
  );

  server.registerResource(
    "remocn-preview",
    PREVIEW_RESOURCE_URI,
    {
      title: "remocn live preview",
      description: "Plays remocn components and video plans in the chat.",
      mimeType: MCP_APP_MIME_TYPE,
      _meta: previewResourceMeta(),
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: MCP_APP_MIME_TYPE,
          text: PREVIEW_WIDGET_HTML,
          _meta: previewResourceMeta(),
        },
      ],
    }),
  );

  return server;
}
