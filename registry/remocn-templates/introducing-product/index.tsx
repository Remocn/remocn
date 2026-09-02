"use client";

import { AbsoluteFill, Series } from "remotion";
import { BrandScene } from "./scenes/brand";
import { CommandScene } from "./scenes/command";
import { FeaturesScene } from "./scenes/features";
import { HookScene } from "./scenes/hook";
import { LearningLoopScene } from "./scenes/learning-loop";
import { MontageScene } from "./scenes/montage";
import { OutroScene } from "./scenes/outro";
import { ProductUiScene } from "./scenes/product-ui";
import { SpeedScene } from "./scenes/speed";
import { TopicsScene } from "./scenes/topics";
import {
  type IntroducingProductProps,
  normalizeIntroducingProductProps,
} from "./types";

export type { IntroducingProductStudioProps } from "./schema";
export {
  DEFAULT_INTRODUCING_PRODUCT_PROPS,
  introducingProductSchema,
} from "./schema";
export type { IntroducingProductProps, ProductFeature } from "./types";
export {
  getIntroducingProductDuration,
  getIntroducingProductSceneStart,
  INTRODUCING_PRODUCT_DURATION,
  INTRODUCING_PRODUCT_TIMELINE,
} from "./types";

export function IntroducingProduct(props: IntroducingProductProps = {}) {
  const content = normalizeIntroducingProductProps(props);
  const timeline = content.timeline;

  return (
    <AbsoluteFill
      className={content.className || undefined}
      style={{
        backgroundColor: content.theme.darkBackground,
        overflow: "hidden",
        scale: content.theme.canvasScale,
      }}
    >
      <Series>
        <Series.Sequence name="Hook" durationInFrames={timeline.hook}>
          <HookScene {...content} sceneDuration={timeline.hook} />
        </Series.Sequence>
        <Series.Sequence name="Command" durationInFrames={timeline.command}>
          <CommandScene {...content} sceneDuration={timeline.command} />
        </Series.Sequence>
        <Series.Sequence name="Brand reveal" durationInFrames={timeline.brand}>
          <BrandScene {...content} sceneDuration={timeline.brand} />
        </Series.Sequence>
        <Series.Sequence
          name="Product UI"
          durationInFrames={timeline.productUi}
        >
          <ProductUiScene {...content} sceneDuration={timeline.productUi} />
        </Series.Sequence>
        <Series.Sequence
          name="Value counter"
          durationInFrames={timeline.speedScene}
        >
          <SpeedScene {...content} sceneDuration={timeline.speedScene} />
        </Series.Sequence>
        <Series.Sequence
          name="Feature walkthrough"
          durationInFrames={timeline.features}
        >
          <FeaturesScene {...content} sceneDuration={timeline.features} />
        </Series.Sequence>
        <Series.Sequence
          name="Card montage"
          durationInFrames={timeline.montage}
        >
          <MontageScene {...content} sceneDuration={timeline.montage} />
        </Series.Sequence>
        <Series.Sequence
          name="Learning loop"
          durationInFrames={timeline.learningLoop}
        >
          <LearningLoopScene
            {...content}
            sceneDuration={timeline.learningLoop}
          />
        </Series.Sequence>
        <Series.Sequence
          name="Topic cascade"
          durationInFrames={timeline.topics}
        >
          <TopicsScene {...content} sceneDuration={timeline.topics} />
        </Series.Sequence>
        <Series.Sequence name="Outro" durationInFrames={timeline.outro}>
          <OutroScene {...content} sceneDuration={timeline.outro} />
        </Series.Sequence>
      </Series>
    </AbsoluteFill>
  );
}
