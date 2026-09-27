"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion, useScroll, useSpring } from "framer-motion";
import { GitHubIcon, LinkedInIcon } from "@/components/Icons";
import { links } from "@/data/portfolio";

const nav = [
  { href: "#campaign", id: "campaign", label: "Projects" },
  { href: "#service-record", id: "service-record", label: "Experience" },
  { href: "#loadout", id: "loadout", label: "Skills" },
  { href: "#firefight", id: "firefight", label: "Play" },
  { href: "#comms", id: "comms", label: "Contact" },
];

// Halo's shield bar, repurposed as a reading-progress meter.
// It runs one recharge flash on load, then tracks scroll.
function ShieldBar() {
  const { scrollYProgress } = useScroll();
  const fill = useSpring(scrollYProgress, { stiffness: 120, damping: 24, mass: 0.3 });
  const reduce = useReducedMotion();
  const shape = "polygon(10px 0, calc(100% - 10px) 0, 100% 100%, 0 100%)";

  return (
    <div className="relative w-28 sm:w-56 md:w-72" aria-hidden="true">
      <div
        className="relative h-[10px] overflow-hidden bg-holo/10"
        style={{ clipPath: shape }}
      >
        <motion.div
          className="absolute inset-0 origin-left bg-gradient-to-r from-holo/70 to-holo"
          style={{ scaleX: fill }}
        />
        {/* segment ticks */}
        <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,transparent_0_14px,rgba(3,6,11,0.85)_14px_16px)]" />
        {!reduce && (
          <motion.div
            className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/90 to-transparent"
            initial={{ left: "-35%" }}
            animate={{ left: "105%" }}
            transition={{ duration: 1.1, delay: 0.35, ease: "easeInOut" }}
          />
        )}
      </div>
      <div
        className="mx-auto mt-[3px] h-px w-[92%] bg-holo/40"
        style={{ clipPath: shape }}
      />
    </div>
  );
}

// Keyboard-only shortcut. It hides again once used or once the page scrolls,
// so it never lingers on screen after a click.
function SkipLink() {
  const ref = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const onScroll = () => {
      if (document.activeElement === ref.current) ref.current?.blur();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <a
      ref={ref}
      href="#campaign"
      onClick={(e) => e.currentTarget.blur()}
      className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:left-4 focus-visible:top-20 focus-visible:z-[60] focus-visible:bg-visor focus-visible:px-4 focus-visible:py-2 focus-visible:font-hud focus-visible:text-void"
    >
      Skip to projects
    </a>
  );
}

export default function Header() {
  const [active, setActive] = useState<string>("");

  useEffect(() => {
    const sections = nav
      .map((n) => document.getElementById(n.id))
      .filter((el): el is HTMLElement => el !== null);
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id);
        }
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-line bg-void/70 backdrop-blur-md">
      <SkipLink />
      <div className="mx-auto grid h-16 max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 sm:px-6">
        <Link
          href="/"
          aria-label="Back to main menu"
          className="group flex items-center gap-3 justify-self-start"
        >
          <Image
            src="/images/logo.png"
            alt=""
            width={40}
            height={40}
            className="h-9 w-9 object-contain transition-transform duration-300 group-hover:scale-110"
          />
          <span className="hidden font-display text-lg tracking-wide text-ink sm:block">
            Amogh Shukla
          </span>
        </Link>

        <ShieldBar />

        <div className="flex items-center gap-5 justify-self-end">
          <nav aria-label="Sections" className="hidden lg:block">
            <ul className="flex gap-6 font-hud text-[15px] tracking-wide">
              {nav.map((item) => (
                <li key={item.id}>
                  <a
                    href={item.href}
                    aria-current={active === item.id ? "true" : undefined}
                    className={`relative py-1 transition-colors ${
                      active === item.id ? "text-visor" : "text-muted hover:text-ink"
                    }`}
                  >
                    {item.label}
                    <span
                      className={`absolute inset-x-0 -bottom-0.5 h-px bg-visor transition-opacity ${
                        active === item.id ? "opacity-100" : "opacity-0"
                      }`}
                    />
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <div className="flex items-center gap-2">
            <a
              href={links.github}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub profile"
              className="grid h-9 w-9 place-items-center text-muted transition-colors hover:text-holo"
            >
              <GitHubIcon />
            </a>
            <a
              href={links.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn profile"
              className="grid h-9 w-9 place-items-center text-muted transition-colors hover:text-holo"
            >
              <LinkedInIcon />
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
