import { motion } from "motion/react";
import { Skeleton } from "@/components/ui/skeleton";
import { SPRING_BOUNCE } from "@/config/site";

/** Ghost avatar chips streaming in — the "stargazers flying in" tease. */
export function AvatarChips({ reduced }: { reduced: boolean }) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {Array.from({ length: 9 }).map((_, i) => (
        <motion.div
          key={i}
          initial={reduced ? false : { opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={
            reduced ? undefined : { ...SPRING_BOUNCE, delay: i * 0.06 }
          }
        >
          <Skeleton className="size-9 rounded-full" />
        </motion.div>
      ))}
    </div>
  );
}
