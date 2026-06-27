import type { CSSProperties } from "react";

type Shard = {
  left: string;
  size: number;
  delay: string;
  duration: string;
  rotStart: string;
  rotEnd: string;
  opacity: number;
  clip: string;
};

// A few angular clip-path silhouettes so shards look like broken glass
const clips = [
  "polygon(50% 0%, 100% 65%, 60% 100%, 0% 80%)",
  "polygon(0% 0%, 100% 25%, 75% 100%, 20% 70%)",
  "polygon(50% 0%, 100% 100%, 0% 100%)",
  "polygon(20% 0%, 100% 40%, 80% 100%, 0% 60%)",
];

// Fewer shards, slow fall — calm and ambient.
const shards: Shard[] = [
  { left: "10%", size: 24, delay: "0s",   duration: "16s", rotStart: "0deg",   rotEnd: "200deg",  opacity: 0.6, clip: clips[0] },
  { left: "26%", size: 16, delay: "6s",   duration: "20s", rotStart: "30deg",  rotEnd: "-180deg", opacity: 0.45, clip: clips[2] },
  { left: "44%", size: 30, delay: "3s",   duration: "18s", rotStart: "-20deg", rotEnd: "190deg",  opacity: 0.65, clip: clips[1] },
  { left: "63%", size: 18, delay: "9s",   duration: "22s", rotStart: "10deg",  rotEnd: "-200deg", opacity: 0.5, clip: clips[3] },
  { left: "80%", size: 26, delay: "4.5s", duration: "17s", rotStart: "20deg",  rotEnd: "210deg",  opacity: 0.6, clip: clips[0] },
];

export default function GlassShards() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {shards.map((shard, i) => (
        <span
          key={i}
          className="glass-shard absolute top-0 block"
          style={
            {
              left: shard.left,
              width: `${shard.size}px`,
              height: `${shard.size * 1.4}px`,
              clipPath: shard.clip,
              background:
                "linear-gradient(135deg, rgba(255,255,255,0.45), rgba(34,211,238,0.2) 45%, rgba(56,189,248,0.08))",
              border: "1px solid rgba(255,255,255,0.35)",
              boxShadow: "0 0 8px rgba(34,211,238,0.4)",
              willChange: "transform, opacity",
              "--rot-start": shard.rotStart,
              "--rot-end": shard.rotEnd,
              "--shard-opacity": shard.opacity,
              animation: `shard-fall ${shard.duration} linear ${shard.delay} infinite`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
