import { SectionTitle } from "../ui/section-title";
import { WallColumns } from "./testimonials-wall/wall-columns";
import { WallFooter } from "./testimonials-wall/wall-footer";
import { XSpotlight } from "./testimonials-wall/x-spotlight";

/** "Loved by builders": a clipped wall of X posts (desktop), a spotlight (mobile). */
export function TestimonialsWall() {
  return (
    <section
      data-section="testimonials-wall"
      className="overflow-clip pt-[72px] lg:pt-5 lg:pb-[120px]"
    >
      <div className="lg:hidden">
        <XSpotlight />
      </div>

      <div className="landing-container hidden flex-col items-center gap-12 lg:flex">
        <SectionTitle
          title="Loved by builders"
          continuation="In their own words, on X."
          align="center"
        />
        <WallColumns />
        <WallFooter />
      </div>
    </section>
  );
}
