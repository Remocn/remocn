/**
 * Typefaces the docs customizer offers for a component's `fontFamily` prop,
 * next to the component's own. A component loads only its own font, so the
 * preview loads a picked one before handing it over; in a project the reader
 * loads it themselves (`@remotion/google-fonts/<Name>`).
 */
const FONTS = {
  Inter: () => import("@remotion/google-fonts/Inter"),
  Geist: () => import("@remotion/google-fonts/Geist"),
  Manrope: () => import("@remotion/google-fonts/Manrope"),
  "Space Grotesk": () => import("@remotion/google-fonts/SpaceGrotesk"),
  "Bricolage Grotesque": () =>
    import("@remotion/google-fonts/BricolageGrotesque"),
  "Instrument Serif": () => import("@remotion/google-fonts/InstrumentSerif"),
  Fraunces: () => import("@remotion/google-fonts/Fraunces"),
  "JetBrains Mono": () => import("@remotion/google-fonts/JetBrainsMono"),
} as const;

export const PREVIEW_FONTS = Object.keys(FONTS) as (keyof typeof FONTS)[];

const WEIGHTS = ["300", "400", "500", "600", "700"];

/** The part of a `@remotion/google-fonts/<Name>` module used here. */
type FontModule = {
  getInfo: () => { fonts: Record<string, Record<string, unknown>> };
  loadFont: (
    style: "normal",
    options: { weights: string[]; subsets: string[] },
  ) => { waitUntilDone: () => Promise<unknown> };
};
const loaded = new Map<string, Promise<void>>();

/** Loads one of `PREVIEW_FONTS`; any other name resolves at once. */
export function loadPreviewFont(name: string): Promise<void> {
  const load = FONTS[name as keyof typeof FONTS];
  if (!load) return Promise.resolve();
  let pending = loaded.get(name);
  if (!pending) {
    pending = load().then(async (module) => {
      // Each family types its own weights; the shared shape is enough here.
      const font = module as unknown as FontModule;
      const available = Object.keys(font.getInfo().fonts.normal ?? {});
      // Not every family ships every weight (Instrument Serif is 400 only);
      // asking for a missing one throws.
      const weights = WEIGHTS.filter((w) => available.includes(w));
      await font
        .loadFont("normal", { weights, subsets: ["latin"] })
        .waitUntilDone();
    });
    loaded.set(name, pending);
  }
  return pending;
}
