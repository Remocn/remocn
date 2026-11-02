import Link from "next/link";
import type { ReactNode } from "react";
import { CopyButton } from "@/components/docs/copy-button";
import { cn } from "@/lib/utils";
import { previewManifest } from "@/registry/__manifest__";
import templatesRegistry from "@/registry/remocn-templates/registry.json";
import { docsSource, getEntry, getPage, loadDocsSource } from "../data";
import { TemplatePoster } from "./template-poster";

type RegistryItem = { name: string; registryDependencies?: string[] };

/** Docs page of a registry component, by its `component` frontmatter. */
function componentUrl(dep: string): string | undefined {
  const name = dep.replace("@remocn/", "");
  return docsSource()
    .getPages()
    .find((page) => page.data.component === name)?.url;
}

function formatRate(fps: number): string {
  return Number.isInteger(fps) ? String(fps) : fps.toFixed(2);
}

function formatClock(seconds: number): string {
  const whole = Math.round(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

/**
 * One template: live poster, title linking to its page, vibe tag,
 * description, playback specs from the preview manifest, what is inside
 * (editorial `inside` chips plus its remocn registry dependencies) and the
 * install command. The MDX `##` heading is kept (visually hidden) so the
 * template stays in the table of contents.
 */
export async function TemplateCard({
  name,
  inside = [],
  still,
  children,
}: {
  /** Registry name, e.g. "release-teaser". */
  name: string;
  inside?: string[];
  /** Frame the poster rests on; defaults to 45% through. */
  still?: number;
  children: ReactNode;
}) {
  await loadDocsSource();
  const url = `/docs/templates/${name}`;
  const entry = getEntry(url);
  const vibe = getPage(`/docs/templates/${name}`)?.data.vibe;
  const preview = previewManifest[name];
  const deps =
    (templatesRegistry.items as RegistryItem[]).find(
      (item) => item.name === name,
    )?.registryDependencies ?? [];
  const seconds = preview ? preview.durationInFrames / preview.fps : 0;
  const command = `npx shadcn@latest add @remocn/${name}`;

  const specs = preview
    ? [
        { label: "Duration", value: `${seconds.toFixed(1)} s` },
        {
          label: "Format",
          value: `${preview.compositionWidth}×${preview.compositionHeight}`,
        },
        { label: "Frames", value: String(preview.durationInFrames) },
        { label: "Frame rate", value: formatRate(preview.fps) },
      ]
    : [];

  return (
    <article
      data-not-typeset
      className="not-prose mt-5 flex scroll-mt-28 flex-col gap-1.5 rounded-card border border-hairline bg-surface p-1.5 [&_h2]:sr-only"
    >
      {children}
      <TemplatePoster
        name={name}
        still={still ?? Math.round((preview?.durationInFrames ?? 0) * 0.45)}
        duration={formatClock(seconds)}
      />
      <div className="flex flex-col gap-4 px-2 pt-3 pb-1 sm:flex-row sm:gap-6 sm:px-3 sm:pt-3.5 sm:pb-2">
        <div className="flex grow flex-col gap-1.5">
          <div className="flex items-center gap-2.5">
            <Link
              href={url}
              className="rounded-tag text-[22px] leading-7 font-medium tracking-title text-foreground outline-none hover:underline hover:decoration-divider hover:underline-offset-4 focus-visible:ring-3 focus-visible:ring-ring"
            >
              {entry?.title ?? name}
            </Link>
            {vibe && (
              <span className="flex h-[22px] items-center rounded-tag bg-surface-muted px-2 text-micro leading-[14px] text-muted-foreground capitalize">
                {vibe}
              </span>
            )}
          </div>
          <p className="text-small leading-[22px] text-body">
            {entry?.description}
          </p>
        </div>
        <dl className="grid shrink-0 grid-cols-2 content-start gap-1.5 sm:w-[232px]">
          {specs.map((spec) => (
            <div
              key={spec.label}
              className="flex flex-col gap-0.5 rounded-[10px] bg-surface-muted px-2.5 py-2"
            >
              <dt className="text-caption leading-4 text-muted-foreground">
                {spec.label}
              </dt>
              <dd className="text-small font-medium text-foreground tabular-nums">
                {spec.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
      {inside.length + deps.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 px-2 pt-1 pb-2.5 sm:px-3">
          <span className="pr-1 text-caption leading-4 text-muted-foreground">
            Inside
          </span>
          {inside.map((label) => (
            <span
              key={label}
              className="flex h-7 items-center rounded-tile bg-secondary px-2.5 text-caption leading-4 text-foreground"
            >
              {label}
            </span>
          ))}
          {deps.map((dep) => {
            const href = componentUrl(dep);
            const chip =
              "flex h-7 items-center rounded-tile bg-secondary px-2.5 font-mono text-mono leading-4 text-foreground";
            return href ? (
              <Link
                key={dep}
                href={href}
                className={cn(
                  chip,
                  "outline-none transition-colors hover:bg-[#dcdde0] focus-visible:ring-3 focus-visible:ring-ring dark:hover:bg-[#33363b]",
                )}
              >
                {dep}
              </Link>
            ) : (
              <span key={dep} className={chip}>
                {dep}
              </span>
            );
          })}
        </div>
      )}
      <div className="flex min-h-[52px] items-center gap-3 rounded-control bg-surface-muted py-2 pr-2 pl-4">
        <code className="min-w-0 grow truncate font-mono text-small text-foreground">
          <span aria-hidden="true">$ </span>
          {command}
        </code>
        <CopyButton value={command} variant="ink" />
      </div>
    </article>
  );
}
