import { zColor } from "@remotion/zod-types";
import { Composition, registerRoot } from "remotion";
import { z } from "zod";
import { LaunchAnything } from "@/registry/remocn-templates/launch-anything";

const schema = z.object({
  opening: z.string().optional(),
  subject: z.string().optional(),
  brandUrl: z.string().optional(),
  accentColor: zColor().optional(),
  content: z
    .object({
      ready: z.string().optional(),
      next: z.string().optional(),
      action: z.string().optional(),
      proof: z.string().optional(),
      industry: z.string().optional(),
      promise: z.string().optional(),
      launch: z.string().optional(),
      shoppers: z.string().optional(),
      builder: z.string().optional(),
      builderPrompt: z.string().optional(),
      trading: z.string().optional(),
      loyalty: z.string().optional(),
      loyaltyPayoff: z.string().optional(),
      integration: z.string().optional(),
      integrations: z.array(z.string()).optional(),
    })
    .optional(),
  media: z
    .object({
      desk: z.string().optional(),
      horizon: z.string().optional(),
      rocket: z.string().optional(),
      earth: z.string().optional(),
    })
    .optional(),
  screenImages: z
    .object({
      dashboard: z.string().optional(),
      shoppers: z.string().optional(),
      exchange: z.string().optional(),
      builder: z.string().optional(),
      trading: z.string().optional(),
      loyalty: z.string().optional(),
      integrations: z.string().optional(),
    })
    .optional(),
  logos: z.array(z.string()).optional(),
  logoSrc: z.string().optional(),
  audioSrc: z.string().optional(),
  volume: z.number().min(0).max(1).optional(),
});

function LaunchAnythingRoot() {
  return (
    <Composition
      id="LaunchAnything"
      component={LaunchAnything}
      durationInFrames={1600}
      fps={60}
      width={1920}
      height={1080}
      schema={schema}
      defaultProps={{
        opening: "Your",
        subject: "product",
        brandUrl: "Launchanything.now",
        accentColor: "#3730ed",
      }}
    />
  );
}
registerRoot(LaunchAnythingRoot);
