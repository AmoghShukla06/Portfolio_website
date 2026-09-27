import type { CSSProperties } from "react";
import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "Amogh Shukla — portfolio";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

const BG = "#03060B";
const CYAN = "#5CD6FF";
const INK = "#DDE7F0";
const BRACKET = "rgba(92, 214, 255, 0.4)";
const INSET = 40;
const ARM = 56;
const LINE = `2px solid ${BRACKET}`;

// Hairline HUD corner brackets, inset from each edge.
const corners: CSSProperties[] = [
  { top: INSET, left: INSET, borderTop: LINE, borderLeft: LINE },
  { top: INSET, right: INSET, borderTop: LINE, borderRight: LINE },
  { bottom: INSET, left: INSET, borderBottom: LINE, borderLeft: LINE },
  { bottom: INSET, right: INSET, borderBottom: LINE, borderRight: LINE },
];

export default async function Image() {
  const handelGothic = await readFile(
    join(process.cwd(), "src/fonts/HandelGothic.ttf"),
  );

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          backgroundColor: BG,
          backgroundImage:
            "radial-gradient(ellipse 70% 60% at 50% 46%, rgba(92, 214, 255, 0.16) 0%, rgba(92, 214, 255, 0.05) 45%, rgba(3, 6, 11, 0) 75%)",
          fontFamily: "Handel Gothic",
        }}
      >
        {corners.map((pos, i) => (
          <div
            key={i}
            style={{ position: "absolute", width: ARM, height: ARM, ...pos }}
          />
        ))}

        <div
          style={{
            display: "flex",
            fontSize: 112,
            color: INK,
            letterSpacing: 4,
            lineHeight: 1,
            textShadow: "0 0 28px rgba(92, 214, 255, 0.35)",
          }}
        >
          Amogh Shukla
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 28,
            fontSize: 30,
            color: CYAN,
            letterSpacing: 1.5,
          }}
        >
          AI engineer building LLM tooling, trading platforms and engines
        </div>

        {/* Shield bar: outlined trapezoid with a filled inner bar, slanted ends */}
        <svg
          width="760"
          height="22"
          viewBox="0 0 760 22"
          style={{ marginTop: 48 }}
        >
          <polygon
            points="0,1 760,1 744,21 16,21"
            fill="none"
            stroke={CYAN}
            strokeOpacity="0.55"
            strokeWidth="1.5"
          />
          <polygon points="12,5 748,5 737,17 23,17" fill={CYAN} />
        </svg>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "Handel Gothic",
          data: handelGothic,
          style: "normal",
          weight: 400,
        },
      ],
    },
  );
}
