import { Img } from "remotion";
import type { SceneProps } from "./content";
import { ramp, tween } from "./motion";
import { Layer, Logo, row } from "./ui";

export function Avatar({
  size = 18,
  index = 0,
  media,
}: {
  size?: number;
  index?: number;
  media: SceneProps["media"];
}) {
  return (
    <Img
      src={media.courses[index % 6]}
      style={{
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius: "50%",
        objectFit: "cover",
        objectPosition: "80% center",
        border: "1px solid #9cafbb70",
      }}
    />
  );
}
export function SocialPost({
  content,
  media,
  light = false,
}: Pick<SceneProps, "content" | "media"> & { light?: boolean }) {
  const muted = light ? "#666" : "#aaa";
  return (
    <div
      style={{
        width: 220,
        padding: 10,
        borderRadius: 12,
        background: light ? "#fff" : "#18191b",
        color: light ? "#101010" : "white",
        border: `1px solid ${light ? "#eee" : "#38393c"}`,
        fontSize: 10,
      }}
    >
      <div style={{ ...row, gap: 7 }}>
        <Avatar media={media} />
        <span>{content.author}</span>
      </div>
      <div
        style={{
          fontSize: 8,
          margin: "8px 0",
          color: muted,
          whiteSpace: "nowrap",
          overflow: "hidden",
        }}
      >
        {content.postTeaser}
      </div>
      <Img
        src={media.post}
        style={{
          width: "100%",
          height: 79,
          objectFit: "cover",
          borderRadius: 6,
        }}
      />
      <div
        style={{
          ...row,
          gap: 12,
          fontSize: 10,
          marginTop: 10,
          color: light ? "#555" : "#eee",
        }}
      >
        <span>♡ 12.8K</span>
        <span>♧ 5.6K</span>
        <span>♧ 3.5K</span>
      </div>
    </div>
  );
}
export function PhoneScreen(props: SceneProps) {
  return (
    <div
      style={{
        width: 250,
        height: 520,
        borderRadius: 33,
        background: "#0a0b0c",
        border: "1px solid #474b50",
        overflow: "hidden",
        color: "white",
        boxShadow: "0 14px 25px #0004",
        padding: "20px 13px",
      }}
    >
      <div
        style={{
          ...row,
          justifyContent: "space-between",
          height: 21,
          marginBottom: 18,
        }}
      >
        <Logo {...props} size={12} />
        <div
          style={{
            width: 53,
            height: 17,
            borderRadius: 10,
            border: `1.5px solid ${props.accent}`,
          }}
        />
        <span style={{ fontSize: 7, color: "#777" }}>▮▮ ▰</span>
      </div>
      <div
        style={{
          ...row,
          fontSize: 16,
          gap: 7,
          paddingBottom: 11,
          borderBottom: "1px solid #38383c",
        }}
      >
        <span
          style={{
            border: "1px solid #aaa",
            padding: "1px 5px",
            borderRadius: 6,
            fontWeight: 700,
          }}
        >
          S
        </span>
        {props.content.feedTitle}
      </div>
      <div style={{ marginTop: 8 }}>
        <SocialPost {...props} />
      </div>
      <div style={{ marginTop: 8 }}>
        <SocialPost {...props} />
      </div>
    </div>
  );
}

const channelGroups = [
  ["START HERE", "welcome", "announcements"],
  ["COMMUNITY", "general-chat", "wins", "content-reviews"],
  ["GROWTH", "hooks-and-ideas", "monetization"],
];
export function Dashboard({
  page = "community",
  light = false,
  ...props
}: SceneProps & {
  page?: "community" | "courses" | "editor";
  light?: boolean;
}) {
  const { t, content, media } = props;
  const fg = light ? "#171717" : "#eee";
  const muted = light ? "#777" : "#858588";
  const panel = light ? "#fff" : "#101010";
  const line = light ? "#ededed" : "#242426";
  const uploaded = page === "editor" && t >= 23;
  return (
    <div
      style={{
        width: 800,
        height: 500,
        position: "relative",
        overflow: "hidden",
        background: panel,
        color: fg,
        borderRadius: 9,
        border: `1px solid ${line}`,
        boxShadow: "0 14px 45px #0003",
        fontSize: 11,
      }}
    >
      <Layer
        w={30}
        h={500}
        style={{
          background: light ? "#f2f3f5" : "#090909",
          borderRight: `1px solid ${line}`,
          paddingTop: 8,
          display: "flex",
          alignItems: "center",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <div
          style={{
            width: 20,
            height: 20,
            borderRadius: 6,
            display: "grid",
            placeItems: "center",
            background: props.accent,
            color: "white",
            fontWeight: 800,
          }}
        >
          R
        </div>
        <Avatar media={media} size={21} index={2} />
        <Avatar media={media} size={21} index={4} />
        <span style={{ fontSize: 20, color: muted }}>＋</span>
      </Layer>
      <Layer
        x={30}
        w={162}
        h={500}
        style={{ borderRight: `1px solid ${line}` }}
      >
        <div
          style={{
            height: 58,
            padding: "10px 9px",
            background: light ? "#1a1b19" : "#121411",
            color: "white",
            fontSize: 11,
          }}
        >
          <Logo {...props} size={10} />
          <div style={{ ...row, gap: 5, marginTop: 8 }}>
            <Avatar media={media} size={17} />
            {content.community}
            <span style={{ marginLeft: "auto" }}>⌄</span>
          </div>
        </div>
        <div style={{ padding: "10px 8px" }}>
          {channelGroups.map((group) => (
            <div key={group[0]} style={{ marginBottom: 12 }}>
              <div style={{ color: muted, fontSize: 8, margin: "3px 5px 7px" }}>
                ⌄　{group[0]}
              </div>
              {group.slice(1).map((label) => (
                <div
                  key={label}
                  style={{
                    padding: "5px 8px",
                    background:
                      page === "community" && label === "welcome"
                        ? "#c39c3322"
                        : undefined,
                    borderRadius: 3,
                    fontSize: 10,
                    color: label === "welcome" ? "#b69a40" : muted,
                  }}
                >
                  #　{label}
                </div>
              ))}
            </div>
          ))}
          <div
            style={{
              borderTop: `1px solid ${line}`,
              marginTop: 8,
              padding: "12px 6px",
              background: page !== "community" ? "#b29b401c" : undefined,
            }}
          >
            ▣　Courses
          </div>
          <div style={{ padding: "4px 6px", color: muted }}>◷　Events</div>
        </div>
        <Layer x={12} y={453} style={{ color: muted, fontSize: 9 }}>
          ⚙　Settings
          <br />
          ◎　Invite members
        </Layer>
      </Layer>
      {page === "community" ? (
        <Layer x={212} y={20} w={563}>
          <div style={{ fontSize: 16, marginBottom: 14 }}>
            # welcome{" "}
            <span style={{ color: "#6bbe83", fontSize: 9 }}>● Open</span>
          </div>
          <div
            style={{
              height: 29,
              borderBottom: `1px solid ${line}`,
              color: "#b6a449",
              fontSize: 10,
            }}
          >
            ◉ Pinned
          </div>
          <div
            style={{
              ...row,
              gap: 9,
              padding: "19px 10px",
              color: muted,
              border: `1px solid ${line}`,
              borderRadius: 8,
              marginTop: 14,
            }}
          >
            <Avatar media={media} />
            Share something with the community...
          </div>
          {[0, 1].map((i) => (
            <div
              key={i}
              style={{
                marginTop: 15,
                padding: 12,
                border: `1px solid ${line}`,
                borderRadius: 9,
              }}
            >
              <div style={{ ...row, gap: 8 }}>
                <Avatar media={media} index={i} />
                <span>
                  {i ? "Alex Rivera" : content.community}
                  <span style={{ color: "#c6a547", fontSize: 8 }}>　Admin</span>
                </span>
              </div>
              <div style={{ margin: "10px 0", fontSize: 10, lineHeight: 1.6 }}>
                New week, new momentum. Share what you are working on with the
                community.
                <br />
                Everything you need to learn, build, and grow — all in one
                place.
              </div>
              {i === 0 && (
                <Img
                  src={media.post}
                  style={{
                    width: 240,
                    height: 83,
                    objectFit: "cover",
                    borderRadius: 4,
                  }}
                />
              )}
              <div style={{ marginTop: 10, color: muted, fontSize: 9 }}>
                ♡ 2.4K　♧ 74
              </div>
            </div>
          ))}
        </Layer>
      ) : page === "courses" ? (
        <Layer x={212} y={27} w={560}>
          <div
            style={{ ...row, justifyContent: "space-between", marginBottom: 5 }}
          >
            <span style={{ fontSize: 16 }}>Courses</span>
            <span
              style={{
                background: light ? "#111" : "#fff",
                color: light ? "#fff" : "#111",
                borderRadius: 4,
                padding: "4px 8px",
                fontSize: 9,
              }}
            >
              ＋ Create course
            </span>
          </div>
          <div style={{ color: muted, fontSize: 9, marginBottom: 17 }}>
            Learn at your pace. Build something meaningful.
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 10,
            }}
          >
            {content.courseTitles.map((title, i) => (
              <div
                key={title}
                style={{
                  borderRadius: 5,
                  overflow: "hidden",
                  background: light ? "#fff" : "#1a1e21",
                  border: `1px solid ${line}`,
                }}
              >
                <div style={{ position: "relative", height: 98 }}>
                  <Img
                    src={media.courses[i]}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                  {!light && (
                    <Layer
                      w="100%"
                      h="100%"
                      style={{
                        top: 0,
                        background: `linear-gradient(120deg, #122f59, ${props.accent})`,
                        opacity:
                          1 - tween(t, 11.3 + i * 0.075, 11.8 + i * 0.075),
                      }}
                    />
                  )}
                </div>
                <div style={{ padding: 9 }}>
                  <div style={{ fontSize: 10, fontWeight: 600, minHeight: 27 }}>
                    {title}
                  </div>
                  <div
                    style={{
                      fontSize: 8,
                      color: muted,
                      lineHeight: 1.6,
                      height: 30,
                    }}
                  >
                    Build a personal brand with repeatable systems and practical
                    lessons.
                  </div>
                  <div style={{ marginTop: 9, color: muted, fontSize: 8 }}>
                    ♧ {120 + i * 67} enrolled
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Layer>
      ) : (
        <>
          <Layer
            x={192}
            y={0}
            w={230}
            h={500}
            style={{ borderRight: `1px solid ${line}`, padding: 17 }}
          >
            <div style={{ fontSize: 11, marginBottom: 27 }}>
              ←　{content.courseTitles[0]}
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 32 }}>
              {content.courseTitles[0]}　⋮
            </div>
            <div style={{ fontSize: 9, marginBottom: 13 }}>⌄ FOUNDATIONS</div>
            <div
              style={{
                background: "#fff3ce",
                borderLeft: "3px solid #d5a535",
                padding: "9px 4px",
                fontSize: 10,
              }}
            >
              ◉ Find your niche and angle{" "}
              <span style={{ color: "#b59442", fontSize: 7 }}> DRAFT</span>
            </div>
            <div style={{ padding: "11px 7px", fontSize: 10 }}>
              ◉ The Pathway method{" "}
              <span style={{ color: muted, fontSize: 7 }}> DRAFT</span>
            </div>
            <div style={{ padding: "5px 7px", fontSize: 10, color: muted }}>
              ＋ Add lesson
            </div>
            <div style={{ marginTop: 29, fontSize: 9 }}>
              ⌄ THE CONTENT ENGINE
            </div>
          </Layer>
          <Layer x={441} y={31} w={338}>
            <div
              style={{
                ...row,
                justifyContent: "space-between",
                color: muted,
                fontSize: 8,
              }}
            >
              The 90-Day Content Engine{" "}
              <span>
                Preview　
                <span
                  style={{
                    background: "#111",
                    color: "white",
                    padding: 4,
                    borderRadius: 3,
                  }}
                >
                  Publish
                </span>
              </span>
            </div>
            <div style={{ fontSize: 15, marginTop: 23, marginBottom: 14 }}>
              Find your niche and angle
            </div>
            <div
              style={{
                position: "relative",
                height: 188,
                border: "1px solid #efefef",
                borderRadius: 5,
                display: "grid",
                placeItems: "center",
                color: muted,
                fontSize: 9,
              }}
            >
              {uploaded ? (
                <Img
                  src={media.courses[0]}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    opacity: ramp(t, 23, 23.35),
                  }}
                />
              ) : (
                <span style={{ textAlign: "center" }}>
                  ▣<br />
                  Upload a video
                </span>
              )}
            </div>
            <div style={{ fontSize: 9, marginTop: 12, color: muted }}>
              H1　H2　H3　 B　 I　 U　 ≡　↗　☷
            </div>
            <div
              style={{
                fontSize: 8,
                marginTop: 13,
                lineHeight: 1.9,
                opacity: ramp(t, 23.1, 23.6),
              }}
            >
              A lesson for everyone building something meaningful.
              <br />
              <br />
              Start with a clear point of view. Share what you know, find your
              people, and turn your experience into something others can use.
              <br />
              <br />
              Make it clear. Make it useful. Keep going.
            </div>
          </Layer>
        </>
      )}
    </div>
  );
}
