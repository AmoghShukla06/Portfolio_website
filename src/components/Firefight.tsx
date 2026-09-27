"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import SectionHeading from "@/components/SectionHeading";

function Standby() {
  return (
    <div className="panel chamfer grid aspect-[4/3] w-full place-items-center sm:aspect-video [--cut:18px]">
      <p className="font-hud text-lg tracking-[0.14em] text-muted">Loading firefight…</p>
    </div>
  );
}

// The game is split into its own chunk and only fetched when the section nears the viewport.
const FirefightGame = dynamic(() => import("@/components/FirefightGame"), {
  ssr: false,
  loading: Standby,
});

export default function Firefight() {
  const anchor = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    const el = anchor.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin: "800px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section id="firefight" aria-labelledby="firefight-title" className="relative py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading
          id="firefight"
          title="Firefight"
          lead="A Halo-style horde mode with synthesized sound, drawn from scratch on canvas. Hold to fire, R to reload, right-click or G to throw a grenade, M to mute. Hold the line as long as you can."
        />
        <div ref={anchor}>{near ? <FirefightGame /> : <Standby />}</div>
      </div>
    </section>
  );
}
