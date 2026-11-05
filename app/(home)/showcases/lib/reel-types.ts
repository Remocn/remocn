/** Client-safe shapes of the showcase reel (no server imports). */

export type ReelComponent = {
  /** Display name from the showcase, e.g. "Focus Pull". */
  name: string;
  /** Registry item, when the component is installable, e.g. "focus-pull". */
  registryName: string | null;
  /** Docs page on this site, or the showcase's own link. */
  href: string;
};

export type ReelClip = {
  slug: string;
  title: string;
  video: string;
  poster: string;
  author: { name: string; avatarUrl: string; url: string | null };
  iso: string;
  dateLabel: string;
  githubUrl: string | null;
  components: ReelComponent[];
  /** Seconds from the start of the reel. */
  start: number;
  duration: number;
};

export type ReelTrack = { name: string; count: number };

export type Reel = {
  clips: ReelClip[];
  /** Seconds, all clips end to end. */
  total: number;
  /** Most used components, one timeline row each. */
  tracks: ReelTrack[];
};

/** Install command for every installable component of a clip. */
export function installCommand(clip: ReelClip): string | null {
  const names = clip.components.flatMap((component) =>
    component.registryName ? [`@remocn/${component.registryName}`] : [],
  );
  return names.length > 0 ? `npx shadcn add ${names.join(" ")}` : null;
}
