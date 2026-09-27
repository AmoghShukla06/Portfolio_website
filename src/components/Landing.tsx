"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

const menu = [
  { href: "/home", label: "Jump in", hint: "Full portfolio" },
  { href: "/home#campaign", label: "Campaign", hint: "Projects" },
  { href: "/home#service-record", label: "Service record", hint: "Experience" },
  { href: "/home#loadout", label: "Loadout", hint: "Skills" },
  { href: "/home#comms", label: "Comms", hint: "Contact" },
];

export default function Landing() {
  const router = useRouter();
  const [selected, setSelected] = useState(0);
  const items = useRef<(HTMLAnchorElement | null)[]>([]);

  // Controller-style navigation: arrows / W-S move, Enter selects.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const inMenu =
        document.activeElement === document.body ||
        items.current.some((el) => el === document.activeElement);
      if (!inMenu) return;
      const key = e.key.toLowerCase();
      if (key === "arrowdown" || key === "s") {
        e.preventDefault();
        setSelected((s) => {
          const n = (s + 1) % menu.length;
          items.current[n]?.focus();
          return n;
        });
      } else if (key === "arrowup" || key === "w") {
        e.preventDefault();
        setSelected((s) => {
          const n = (s - 1 + menu.length) % menu.length;
          items.current[n]?.focus();
          return n;
        });
      } else if (key === "enter" && document.activeElement === document.body) {
        router.push(menu[selected].href);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router, selected]);

  useEffect(() => {
    menu.forEach((m) => router.prefetch(m.href));
  }, [router]);

  return (
    <main className="relative h-[100svh] w-full overflow-hidden bg-void">
      <video
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster="/images/landing-poster.jpg"
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover"
      >
        <source src="/videos/background_theme.webm" type="video/webm" />
      </video>

      <div className="absolute inset-0 bg-gradient-to-r from-void/95 via-void/55 to-void/10" />
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-void/90 to-transparent" />
      <div className="scanlines opacity-70" />

      <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-end px-4 pb-14 sm:px-6 sm:pb-20">
        <h1 className="holo-on font-display text-[clamp(3rem,13vw,9rem)] uppercase italic leading-[0.88] text-ink text-glow">
          Amogh
          <br />
          Shukla
        </h1>
        <p
          className="holo-on mt-4 font-hud text-lg tracking-[0.14em] text-holo sm:text-xl"
          style={{ animationDelay: "0.35s" }}
        >
          AI engineer and CS student
        </p>

        <nav aria-label="Main menu" className="mt-10 w-full max-w-md sm:mt-12">
          <ul className="border-y border-white/10">
            {menu.map((item, i) => {
              const active = i === selected;
              return (
                <motion.li
                  key={item.href}
                  initial={{ opacity: 0, x: -24 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + i * 0.08, duration: 0.45, ease: "easeOut" }}
                >
                  <Link
                    href={item.href}
                    ref={(el) => {
                      items.current[i] = el;
                    }}
                    onMouseEnter={() => setSelected(i)}
                    onFocus={() => setSelected(i)}
                    className={`relative flex items-baseline justify-between gap-4 py-3 pl-5 pr-4 transition-colors focus-visible:outline-none ${
                      active
                        ? "bg-gradient-to-r from-holo/25 via-holo/10 to-transparent text-white"
                        : "text-ink/70"
                    }`}
                  >
                    <span
                      className={`absolute inset-y-1.5 left-0 w-[3px] ${
                        active ? "bg-visor shadow-[0_0_12px_rgba(242,169,59,0.8)]" : "bg-transparent"
                      }`}
                    />
                    <span
                      className={`font-display tracking-wide ${
                        i === 0 ? "text-2xl sm:text-3xl" : "text-lg sm:text-xl"
                      }`}
                    >
                      {item.label}
                    </span>
                    <span className={`font-hud text-sm tracking-wide ${active ? "text-holo" : "text-muted"}`}>
                      {item.hint}
                    </span>
                  </Link>
                </motion.li>
              );
            })}
          </ul>
        </nav>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 font-hud text-sm tracking-wide text-muted">
          <p>A portfolio inspired by the Halo series</p>
          <p className="hidden items-center gap-5 sm:flex" aria-hidden="true">
            <span className="flex items-center gap-2">
              <kbd className="border border-white/25 px-1.5 py-0.5 font-hud text-xs text-ink">↑↓</kbd>
              Navigate
            </span>
            <span className="flex items-center gap-2">
              <kbd className="border border-white/25 px-1.5 py-0.5 font-hud text-xs text-ink">Enter</kbd>
              Select
            </span>
          </p>
        </div>
      </div>
    </main>
  );
}
