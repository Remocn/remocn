import { zColor } from "@remotion/zod-types";
import { Composition, registerRoot } from "remotion";
import { z } from "zod";
import { BrandGuidelines } from "@/registry/remocn-templates/brand-guidelines";

export const brandGuidelinesSchema = z.object({
  brandName: z.string().max(48).optional(),
  accentColor: zColor().optional(),
  content: z
    .object({
      brandName: z.string().optional(),
      openingTagline: z.string().optional(),
      guidelinesLabel: z.string().optional(),
      collageTitle: z.string().optional(),
      collectionLabel: z.string().optional(),
      footer: z.string().optional(),
    })
    .optional(),
  theme: z
    .object({
      ink: zColor().optional(),
      accent: zColor().optional(),
      stone: zColor().optional(),
      paper: zColor().optional(),
    })
    .optional(),
  phrases: z.array(z.string().max(64)).max(8).optional(),
  closingWords: z.array(z.string().max(20)).max(3).optional(),
  photos: z
    .object({
      ceramics: z.string().optional(),
      materials: z.string().optional(),
      chair: z.string().optional(),
    })
    .optional(),
  logoSrc: z.string().optional(),
  audioSrc: z.string().optional(),
  volume: z.number().min(0).max(1).optional(),
  reducedMotion: z.boolean().optional(),
});

function BrandGuidelinesRoot() {
  return (
    <Composition
      id="BrandGuidelines"
      component={BrandGuidelines}
      width={1920}
      height={1080}
      fps={60}
      durationInFrames={1072}
      schema={brandGuidelinesSchema}
      defaultProps={{
        brandName: "Form Study",
        accentColor: "#A64B38",
        reducedMotion: false,
      }}
    />
  );
}
registerRoot(BrandGuidelinesRoot);
