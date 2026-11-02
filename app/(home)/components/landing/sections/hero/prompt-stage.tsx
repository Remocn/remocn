import { ComposerStatus } from "./composer-status";
import { FloatingScene, ROW_SCENES } from "./floating-scene";
import { PromptComposer } from "./prompt-composer";
import { HeroSceneField } from "./scenes/hero-scene-field";

/**
 * The composer with the scenes it produced. From xl up the scenes float
 * around it, rotated; below xl they become a horizontal row under it.
 */
export function PromptStage() {
  return (
    <div className="hero-in hero-rise relative mx-auto flex [--reveal-i:5] w-full max-w-[1440px] flex-col gap-5 overflow-x-clip pt-10 md:pb-20 xl:gap-0 xl:pt-[130px] xl:pb-[320px]">
      <HeroSceneField />

      <PromptComposer />

      <div className="flex gap-3 overflow-x-auto px-5 pt-1 pb-6 [scrollbar-width:none] md:justify-center xl:hidden">
        {ROW_SCENES.map((scene) => (
          <FloatingScene key={scene.index} scene={scene} variant="row" />
        ))}
      </div>

      <ComposerStatus />
    </div>
  );
}
