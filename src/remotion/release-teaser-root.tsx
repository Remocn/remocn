import { zColor } from "@remotion/zod-types";
import { Composition, registerRoot } from "remotion";
import { z } from "zod";
import { ReleaseTeaser } from "@/registry/remocn-templates/release-teaser";

export const releaseTeaserSchema = z.object({
  brandName: z.string().max(48).optional(),
  release: z.string().max(16).optional(),
  tagline: z.string().max(120).optional(),
  statements: z.array(z.string().max(140)).max(5).optional(),
  accentColor: zColor().optional(),
  theme: z
    .object({
      background: zColor().optional(),
      surface: zColor().optional(),
      foreground: zColor().optional(),
      muted: zColor().optional(),
      accent: zColor().optional(),
    })
    .optional(),
  logoSrc: z.string().optional(),
  lightIntensity: z.number().min(0).max(2).optional(),
  reducedMotion: z.boolean().optional(),
  audioSrc: z.string().optional(),
  volume: z.number().min(0).max(1).optional(),
});

function ReleaseTeaserRoot() {
  return (
    <Composition
      id="ReleaseTeaser"
      component={ReleaseTeaser}
      width={1920}
      height={1080}
      fps={60000 / 1001}
      durationInFrames={960}
      schema={releaseTeaserSchema}
      defaultProps={{
        brandName: "Orvio",
        release: "2",
        tagline: "Your next chapter starts here.",
        statements: [
          "Start with an idea",
          "Make room\nfor better work",
          "Bring every detail to life",
          "Move together.\nGo further.",
          "A fresh chapter.\nNo starting over.",
        ],
        accentColor: "#9BC8DD",
        lightIntensity: 1,
        reducedMotion: false,
      }}
    />
  );
}
registerRoot(ReleaseTeaserRoot);
