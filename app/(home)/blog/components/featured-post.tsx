import { cn } from "@/lib/utils";
import {
  LandingButton,
  landingButtonVariants,
} from "../../components/landing/ui/landing-button";
import { CopyTextButton } from "../../components/site-page/copy-text-button";
import { type BlogPostSummary, POST_KIND_LABEL } from "../lib/post-types";
import { BeatsList } from "./beats-list";
import { PostMeta } from "./post-meta";
import { ScreeningPlayer } from "./screening-player";

const BUTTON =
  "h-12 w-full rounded-control-sm px-4 text-[15px] leading-5 font-medium md:h-10 md:w-auto";

/**
 * The screening room: the newest launch video in its player, next to the
 * first beats of its storyboard and the two ways in (read it, copy the
 * prompt that rebuilds it).
 */
export function FeaturedPost({ post }: { post: BlogPostSummary }) {
  return (
    <section
      aria-label="Featured making-of"
      className="landing-container md:pb-16 xl:pb-[88px]"
    >
      <div className="flex flex-col gap-2 rounded-panel bg-surface p-2 shadow-[0_0_0_1px_var(--hairline),0_24px_48px_-32px_#0e10122e] md:p-2.5 xl:flex-row xl:rounded-shell">
        {post.video && (
          <ScreeningPlayer
            src={post.video}
            poster={post.poster}
            label={post.title}
            duration={post.duration}
            beats={post.beats.length}
            className="xl:w-[820px] xl:shrink-0"
          />
        )}

        <div className="flex min-w-0 grow flex-col justify-between gap-6 px-3 pt-4 pb-3 md:gap-7 md:pt-7 md:pr-6 md:pb-3.5 md:pl-7">
          <div className="flex flex-col gap-3 md:gap-4">
            <PostMeta
              iso={post.iso}
              date={post.dateLabel}
              tag={POST_KIND_LABEL[post.kind]}
            />
            <h2 className="text-[24px] leading-[30px] font-medium tracking-title text-foreground text-balance md:text-[30px] md:leading-[34px]">
              {post.title}
            </h2>
            <p className="text-ui leading-6 text-muted-foreground text-pretty">
              {post.description}
            </p>
          </div>

          <div className="flex flex-col gap-6">
            <BeatsList beats={post.beats} limit={3} />
            <div className="flex flex-col gap-2 md:flex-row">
              <LandingButton href={`/blog/${post.slug}`} className={BUTTON}>
                Read the making-of
              </LandingButton>
              {post.prompt && (
                <CopyTextButton
                  text={post.prompt}
                  copiedLabel="Prompt copied"
                  className={cn(
                    landingButtonVariants({ variant: "secondary" }),
                    BUTTON,
                  )}
                >
                  Copy the prompt
                </CopyTextButton>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
