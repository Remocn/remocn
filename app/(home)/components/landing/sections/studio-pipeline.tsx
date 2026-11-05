import { PipelineStages } from "./studio-pipeline/pipeline-stages";
import { StudioCopy } from "./studio-pipeline/studio-copy";

export function StudioPipeline() {
  return (
    <section
      data-section="studio-pipeline"
      className="landing-container pt-[72px] xl:pt-0 xl:pb-[140px]"
    >
      <div
        data-reveal="fade"
        className="flex flex-col gap-8 overflow-clip rounded-shell bg-dark-surface px-[22px] pt-7 pb-[22px] md:gap-12 md:p-14 xl:flex-row xl:justify-between xl:gap-[60px] xl:rounded-[32px] xl:pl-[60px]"
      >
        <StudioCopy />
        <PipelineStages />
      </div>
    </section>
  );
}
