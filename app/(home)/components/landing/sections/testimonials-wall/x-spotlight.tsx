import Image from "next/image";
import { getXPost, X_SPOTLIGHT } from "@/config/x-posts";

const linkFocus =
  "outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/**
 * Mobile take on the wall: one pulled quote, then a row of the people who
 * posted. The active person is a pill, the rest are faded avatars; every item
 * links to its post on X.
 */
export function XSpotlight() {
  const active = getXPost(X_SPOTLIGHT.handle);

  return (
    <div data-reveal="stagger" className="flex flex-col items-center gap-7">
      <h2 className="text-muted-foreground text-ui leading-6">
        What builders say on X
      </h2>

      <blockquote cite={active.url} className="px-5 text-center">
        <p className="text-[30px] text-foreground leading-[34px] tracking-heading">
          “{X_SPOTLIGHT.quote}”
        </p>
      </blockquote>

      <ul className="flex w-full items-center justify-center gap-2.5">
        {X_SPOTLIGHT.row.map((handle) => {
          const post = getXPost(handle);

          if (handle === active.handle) {
            return (
              <li key={handle} className="shrink-0">
                <a
                  href={post.url}
                  target="_blank"
                  rel="noreferrer"
                  className={`flex items-center gap-3 rounded-card bg-card py-1.5 pr-[18px] pl-1.5 ring-1 ring-hairline shadow-[0_10px_30px_-14px_rgb(14_16_18/0.25)] transition-shadow hover:ring-divider ${linkFocus}`}
                >
                  <Image
                    src={post.avatar}
                    alt=""
                    width={46}
                    height={46}
                    className="size-[46px] shrink-0 rounded-[14px] object-cover"
                  />
                  <span className="flex flex-col">
                    <span className="whitespace-nowrap font-medium text-[15px] text-foreground leading-5">
                      {post.name}
                    </span>
                    {post.role && (
                      <span className="whitespace-nowrap text-muted-foreground text-small">
                        {capitalize(post.role)}
                      </span>
                    )}
                  </span>
                </a>
              </li>
            );
          }

          return (
            <li key={handle} className="shrink-0">
              <a
                href={post.url}
                target="_blank"
                rel="noreferrer"
                aria-label={`${post.name} on X`}
                className={`block rounded-[14px] opacity-45 transition-opacity hover:opacity-100 ${linkFocus}`}
              >
                <Image
                  src={post.avatar}
                  alt=""
                  width={46}
                  height={46}
                  className="size-[46px] rounded-[14px] object-cover"
                />
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
