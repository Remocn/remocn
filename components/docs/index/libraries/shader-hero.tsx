import { previewManifest } from "@/registry/__manifest__";
import { loadDocsSource } from "../data";
import { HeroPill, HeroTag } from "./hero-pill";
import { getLibraryItems } from "./library-data";
import { RegistryHeroPlayer } from "./registry-hero-player";

/**
 * Shaders overview hero: one shader running full-bleed with a line of copy on
 * top, to show the shader is only the backdrop.
 */
export async function ShaderHero({
  name,
  props,
  title,
  subtitle,
  tags = [],
}: {
  /** Registry name of the shader that runs behind the copy. */
  name: string;
  /** Shader props on top of its preview defaults. */
  props?: Record<string, unknown>;
  title: string;
  subtitle: string;
  tags?: string[];
}) {
  await loadDocsSource();
  const count = getLibraryItems("/docs/shaders").length;
  const preview = previewManifest[name];

  return (
    <figure className="not-prose relative mt-2 flex h-[340px] flex-col justify-between gap-7 overflow-hidden rounded-card bg-dark-surface p-3.5 sm:h-80 sm:p-5">
      <RegistryHeroPlayer slug={name} inputProps={props} />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,#0e101200_40%,#0e10128c_100%)]"
      />
      <div className="relative flex items-center justify-between gap-2">
        <HeroTag mono>{name}</HeroTag>
        {preview && (
          <HeroTag className="text-[#fafafabf] max-sm:text-caption">
            {preview.durationInFrames} frames, {preview.fps} fps
          </HeroTag>
        )}
      </div>
      <figcaption className="relative flex flex-col items-center gap-2 text-center">
        <span className="text-[32px] leading-9 font-medium tracking-heading text-white sm:text-[44px] sm:leading-[48px]">
          {title}
        </span>
        <span className="text-[15px] leading-[22px] text-white/78 sm:text-ui sm:leading-6">
          {subtitle}
        </span>
      </figcaption>
      <div className="relative flex flex-wrap gap-2">
        <HeroPill lead>{count} shaders</HeroPill>
        {tags.map((tag) => (
          <HeroPill key={tag}>{tag}</HeroPill>
        ))}
      </div>
    </figure>
  );
}
