// Components that single docs pages use: the guides, the category indexes,
// the introduction. The docs collection compiles MDX at runtime (`dynamic` in
// source.config.ts), where a page can't `import`, so what a page needs is
// registered here and passed to its MDX by app/docs/[[...slug]]/page.tsx.
// lib/docs-meta.test.ts fails on a docs page that imports or exports.
import type { MDXComponents } from "mdx/types";
import {
  GuideMoreLink,
  GuideNotes,
} from "@/components/docs/guides/director-notes";
import { GuideCount } from "@/components/docs/guides/guide-ui";
import { GuideNote } from "@/components/docs/guides/note";
import {
  GuideBrandBrief,
  GuideBrandLine,
} from "@/components/docs/guides/practice/brand-brief";
import { GuideBrandFrames } from "@/components/docs/guides/practice/brand-frames";
import { BuiltRules } from "@/components/docs/guides/practice/built-rules";
import { BuiltSkeleton } from "@/components/docs/guides/practice/built-skeleton";
import { BuiltVocabulary } from "@/components/docs/guides/practice/built-vocabulary";
import { ClapperIcon } from "@/components/docs/guides/practice/clapper-icon";
import { GuideConsistency } from "@/components/docs/guides/practice/consistency-strip";
import { GuideCtaCard } from "@/components/docs/guides/practice/cta-card";
import { GuideDefinitions } from "@/components/docs/guides/practice/definition-table";
import { DirectingFinish } from "@/components/docs/guides/practice/directing-finish";
import { DirectingLoop } from "@/components/docs/guides/practice/directing-loop";
import { DirectingOptions } from "@/components/docs/guides/practice/directing-options";
import { DirectingPhrases } from "@/components/docs/guides/practice/directing-phrases";
import { DirectingRedirect } from "@/components/docs/guides/practice/directing-redirect";
import { GuideExportPipeline } from "@/components/docs/guides/practice/export-pipeline";
import { GuideFormatFrames } from "@/components/docs/guides/practice/format-frames";
import { GuideMusicTimeline } from "@/components/docs/guides/practice/music-timeline";
import { GuideNoteCard } from "@/components/docs/guides/practice/note-card";
import {
  GuidePhrases,
  GuidePullLine,
  GuideQuote,
} from "@/components/docs/guides/practice/phrase-list";
import { GuideTrackSources } from "@/components/docs/guides/practice/track-sources";
import { WordsTwoSecondTest } from "@/components/docs/guides/practice/two-second-test";
import { WordsFormulas } from "@/components/docs/guides/practice/words-formulas";
import { WordsRules } from "@/components/docs/guides/practice/words-rules";
import { GuidePrompt } from "@/components/docs/guides/prompt-block";
import {
  GuideCallout,
  GuideRenderCard,
} from "@/components/docs/guides/render-card";
import { GuideAgentPicker } from "@/components/docs/guides/setup/agent-picker";
import {
  GuideChecklist,
  GuideStep,
} from "@/components/docs/guides/setup/checklist";
import {
  GuidePluginAside,
  GuideReadyRow,
  GuideStudioPreview,
} from "@/components/docs/guides/setup/studio-preview";
import {
  GuideBeatList,
  GuideStoryboard,
} from "@/components/docs/guides/storyboard";
import { GuideStoryboardPreview } from "@/components/docs/guides/storyboard-preview";
import { GuideFacts } from "@/components/docs/guides/video-facts";
import { GuideWords } from "@/components/docs/guides/words-form";
import { CategoryIndex } from "@/components/docs/index/category/category-index";
import { ComponentGroup } from "@/components/docs/index/category/component-group";
import { GuidePractices } from "@/components/docs/index/guides/guide-practices";
import { GuideVideos } from "@/components/docs/index/guides/guide-videos";
import { SetupCard } from "@/components/docs/index/guides/setup-card";
import { CategoryList } from "@/components/docs/index/home/category-list";
import { GuidesFeature } from "@/components/docs/index/home/guides-feature";
import { LibraryTiles } from "@/components/docs/index/home/library-tiles";
import { StartHere } from "@/components/docs/index/home/start-here";
import { IconsSection } from "@/components/docs/index/icons/icons-section";
import { CompareTable } from "@/components/docs/index/introduction/compare-table";
import { Faq } from "@/components/docs/index/introduction/faq";
import { NextLinks } from "@/components/docs/index/introduction/next-links";
import { NotCards } from "@/components/docs/index/introduction/not-cards";
import {
  Aside,
  FirstComponent,
  Pillar,
  Pillars,
} from "@/components/docs/index/introduction/overview";
import {
  InstallationLink,
  QuickStart,
  Step,
} from "@/components/docs/index/introduction/quick-start";
import {
  AgentSkillPanel,
  ApiChips,
  PartTiles,
} from "@/components/docs/index/introduction/remotion";
import {
  FileFlow,
  IconNote,
  RuntimeDiff,
} from "@/components/docs/index/introduction/runtime";
import { Tier, Tiers } from "@/components/docs/index/introduction/tiers";
import { CaptionHero } from "@/components/docs/index/libraries/caption-hero";
import { FiltersHero } from "@/components/docs/index/libraries/filter-hero-section";
import { HowItWorks } from "@/components/docs/index/libraries/how-it-works";
import { LibraryGallery } from "@/components/docs/index/libraries/library-gallery";
import { RuntimeCommand } from "@/components/docs/index/libraries/runtime-command";
import { ShaderHero } from "@/components/docs/index/libraries/shader-hero";
import { TranscriptSources } from "@/components/docs/index/libraries/transcript-sources";
import {
  AtomCard,
  AtomCards,
  AtomsSection,
} from "@/components/docs/index/primitives/atom-cards";
import { InstallWrites } from "@/components/docs/index/primitives/install-writes";
import { RuntimeRules } from "@/components/docs/index/primitives/runtime-rules";
import { TimelineDemo } from "@/components/docs/index/primitives/timeline-demo";
import { UiBlocks } from "@/components/docs/index/primitives/ui-blocks";
import { UiComponents } from "@/components/docs/index/primitives/ui-components";
import { TemplateCard } from "@/components/docs/index/templates/template-card";
import {
  TemplateStep,
  TemplateSteps,
} from "@/components/docs/index/templates/template-steps";

export const docsPageComponents = {
  AgentSkillPanel,
  ApiChips,
  Aside,
  AtomCard,
  AtomCards,
  AtomsSection,
  BuiltRules,
  BuiltSkeleton,
  BuiltVocabulary,
  CaptionHero,
  CategoryIndex,
  CategoryList,
  ClapperIcon,
  CompareTable,
  ComponentGroup,
  DirectingFinish,
  DirectingLoop,
  DirectingOptions,
  DirectingPhrases,
  DirectingRedirect,
  Faq,
  FileFlow,
  FiltersHero,
  FirstComponent,
  GuideAgentPicker,
  GuideBeatList,
  GuideBrandBrief,
  GuideBrandFrames,
  GuideBrandLine,
  GuideCallout,
  GuideChecklist,
  GuideConsistency,
  GuideCount,
  GuideCtaCard,
  GuideDefinitions,
  GuideExportPipeline,
  GuideFacts,
  GuideFormatFrames,
  GuideMoreLink,
  GuideMusicTimeline,
  GuideNote,
  GuideNoteCard,
  GuideNotes,
  GuidePhrases,
  GuidePluginAside,
  GuidePractices,
  GuidePrompt,
  GuidePullLine,
  GuideQuote,
  GuideReadyRow,
  GuideRenderCard,
  GuidesFeature,
  GuideStep,
  GuideStoryboard,
  GuideStoryboardPreview,
  GuideStudioPreview,
  GuideTrackSources,
  GuideVideos,
  GuideWords,
  HowItWorks,
  IconNote,
  IconsSection,
  InstallationLink,
  InstallWrites,
  LibraryGallery,
  LibraryTiles,
  NextLinks,
  NotCards,
  PartTiles,
  Pillar,
  Pillars,
  QuickStart,
  RuntimeCommand,
  RuntimeDiff,
  RuntimeRules,
  SetupCard,
  ShaderHero,
  StartHere,
  Step,
  TemplateCard,
  TemplateStep,
  TemplateSteps,
  Tier,
  Tiers,
  TimelineDemo,
  TranscriptSources,
  UiBlocks,
  UiComponents,
  WordsFormulas,
  WordsRules,
  WordsTwoSecondTest,
} satisfies MDXComponents;
