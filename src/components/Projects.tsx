"use client";

import Image from "next/image";
import { useRef, useState, type KeyboardEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Schematic from "@/components/Schematic";
import SectionHeading from "@/components/SectionHeading";
import { Chevron, ExternalIcon, GitHubIcon } from "@/components/Icons";
import { missions, sideMissions, type Mission } from "@/data/portfolio";

// One project's feed: its screenshot, or holographic line art when there isn't one.
function VisualLayer({ mission, uid, eager = false }: { mission: Mission; uid: string; eager?: boolean }) {
  return mission.image ? (
    <>
      <Image
        src={mission.image}
        alt={`Screenshot of ${mission.title}`}
        fill
        sizes="(min-width: 1024px) 55vw, 100vw"
        placeholder={typeof mission.image === "string" ? "empty" : "blur"}
        loading={eager ? "eager" : "lazy"}
        className="object-cover object-top saturate-[0.85]"
      />
      {/* tint the feed so it sits inside the hologram */}
      <div className="absolute inset-0 bg-gradient-to-t from-void/60 via-transparent to-holo/10" />
    </>
  ) : (
    <div className="holo-grid absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(92,214,255,0.08),transparent_70%)]">
      <Schematic kind={mission.schematic} uid={uid} className="h-full w-full" />
    </div>
  );
}

function VisualFrame({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="chamfer relative aspect-video overflow-hidden bg-hull [--cut:18px]">
      {children}
      <div className="scanlines" />
      <div className="brackets m-3 opacity-70" />
      <span className="absolute bottom-3 right-4 font-hud text-xs tracking-[0.14em] text-holo/80">{label}</span>
    </div>
  );
}

const feedLabel = (m: Mission) => `${m.category} / ${m.year}`;

function Briefing({ mission, uid, withVisual = true }: { mission: Mission; uid: string; withVisual?: boolean }) {
  return (
    <div>
      {withVisual && (
        <VisualFrame label={feedLabel(mission)}>
          <VisualLayer mission={mission} uid={uid} eager />
        </VisualFrame>
      )}

      <div className="mt-7">
        <h3 className="font-display text-3xl text-ink sm:text-4xl">{mission.title}</h3>
        <p className="mt-2 font-hud text-lg tracking-wide text-holo">{mission.tagline}</p>
        <p className="mt-5 max-w-[68ch] leading-7 text-ink/75">{mission.description}</p>
      </div>

      <div className="mt-8 grid gap-8 sm:grid-cols-[1.3fr_1fr]">
        <div>
          <h4 className="font-hud text-sm tracking-[0.14em] text-muted">Objectives</h4>
          <ul className="mt-3 space-y-2.5">
            {mission.objectives.map((o) => (
              <li key={o} className="flex gap-3 text-[15px] leading-6 text-ink/90">
                <Chevron className="mt-1.5 h-3 w-3 shrink-0 text-holo" />
                {o}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="font-hud text-sm tracking-[0.14em] text-muted">Loadout</h4>
          <ul className="mt-3 flex flex-wrap gap-2">
            {mission.loadout.map((t) => (
              <li
                key={t}
                className="border border-line bg-holo/[0.06] px-2.5 py-1 font-hud text-sm tracking-wide text-ink/85"
              >
                {t}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-9 flex flex-wrap items-center gap-3">
        {mission.repoUrl && (
          <a
            href={mission.repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="panel chamfer inline-flex items-center gap-2.5 px-5 py-2.5 font-hud text-base font-medium tracking-wide text-ink transition-colors hover:text-holo [--cut:8px] [--panel-edge:rgba(92,214,255,0.45)]"
          >
            <GitHubIcon className="h-4 w-4" />
            View source
          </a>
        )}
        {mission.liveUrl && (
          <a
            href={mission.liveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="chamfer inline-flex items-center gap-2.5 bg-holo px-5 py-2.5 font-hud text-base font-semibold tracking-wide text-void transition-[filter] hover:brightness-110 [--cut:8px]"
          >
            {mission.liveLabel ?? "Open live site"}
            <ExternalIcon />
          </a>
        )}
        {mission.note && <p className="font-hud text-sm tracking-wide text-muted">{mission.note}</p>}
      </div>
    </div>
  );
}

function MissionRow({ mission, selected }: { mission: Mission; selected: boolean }) {
  return (
    <>
      <span
        className={`absolute inset-y-2 left-0 w-[3px] transition-colors ${
          selected ? "bg-visor shadow-[0_0_12px_rgba(242,169,59,0.7)]" : "bg-transparent"
        }`}
      />
      <span className="flex items-baseline justify-between gap-4">
        <span
          className={`font-display text-xl transition-colors sm:text-[1.4rem] ${
            selected ? "text-ink" : "text-ink/70 group-hover:text-ink"
          }`}
        >
          {mission.title}
        </span>
        <span className={`shrink-0 font-hud text-sm tracking-wide ${selected ? "text-visor" : "text-muted"}`}>
          {mission.category}
        </span>
      </span>
      <span className="mt-1 block text-sm leading-6 text-muted">{mission.tagline}</span>
    </>
  );
}

export default function Projects() {
  const [selected, setSelected] = useState(0);
  const [openMobile, setOpenMobile] = useState<number | null>(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const current = missions[selected];

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const last = missions.length - 1;
    let next: number | null = null;
    if (e.key === "ArrowDown" || e.key === "ArrowRight") next = selected === last ? 0 : selected + 1;
    if (e.key === "ArrowUp" || e.key === "ArrowLeft") next = selected === 0 ? last : selected - 1;
    if (e.key === "Home") next = 0;
    if (e.key === "End") next = last;
    if (next === null) return;
    e.preventDefault();
    setSelected(next);
    tabs.current[next]?.focus();
  };

  return (
    <section id="campaign" aria-labelledby="campaign-title" className="relative pb-12 pt-24 md:pb-16 md:pt-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading
          id="campaign"
          title="Campaign"
          lead={`${missions.length} projects, most demanding first. Select a mission to read its briefing.`}
        />

        {/* Desktop: Halo mission select — list on the left, briefing on the right */}
        <div className="hidden gap-10 lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          <div
            role="tablist"
            aria-orientation="vertical"
            aria-label="Projects"
            onKeyDown={onKeyDown}
            className="border-y border-line"
          >
            {missions.map((m, i) => (
              <button
                key={m.id}
                ref={(el) => {
                  tabs.current[i] = el;
                }}
                role="tab"
                id={`tab-${m.id}`}
                aria-selected={i === selected}
                aria-controls="mission-briefing"
                tabIndex={i === selected ? 0 : -1}
                onClick={() => setSelected(i)}
                className={`group relative block w-full border-b border-line py-4 pl-6 pr-4 text-left transition-colors last:border-b-0 ${
                  i === selected
                    ? "bg-gradient-to-r from-visor/[0.12] via-visor/[0.03] to-transparent"
                    : "hover:bg-holo/[0.04]"
                }`}
              >
                <MissionRow mission={m} selected={i === selected} />
              </button>
            ))}
          </div>

          <div
            role="tabpanel"
            id="mission-briefing"
            aria-labelledby={`tab-${current.id}`}
            className="relative lg:sticky lg:top-24 lg:self-start"
          >
            {/* Every feed stays mounted, so screenshots preload and switching is instant */}
            <VisualFrame label={feedLabel(current)}>
              {missions.map((m, i) => (
                <div
                  key={m.id}
                  aria-hidden={i !== selected}
                  className={`absolute inset-0 transition-opacity duration-300 ${
                    i === selected ? "opacity-100" : "pointer-events-none opacity-0"
                  }`}
                >
                  <VisualLayer mission={m} uid={`desk-${m.id}`} />
                </div>
              ))}
            </VisualFrame>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={current.id}
                initial={{ opacity: 0, x: 16, filter: "blur(4px)" }}
                animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, x: -10, filter: "blur(4px)" }}
                transition={{ duration: 0.28, ease: "easeOut" }}
              >
                <Briefing mission={current} uid="desk" withVisual={false} />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Mobile + tablet: the same missions as an expanding list */}
        <ul className="border-y border-line lg:hidden">
          {missions.map((m, i) => {
            const open = openMobile === i;
            return (
              <li key={m.id} className="border-b border-line last:border-b-0">
                <button
                  aria-expanded={open}
                  aria-controls={`brief-${m.id}`}
                  onClick={() => setOpenMobile(open ? null : i)}
                  className={`group relative block w-full py-4 pl-5 pr-3 text-left ${
                    open ? "bg-gradient-to-r from-visor/[0.12] to-transparent" : ""
                  }`}
                >
                  <MissionRow mission={m} selected={open} />
                </button>
                <AnimatePresence initial={false}>
                  {open && (
                    <motion.div
                      id={`brief-${m.id}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      className="overflow-hidden"
                    >
                      <div className="pb-10 pt-4">
                        <Briefing mission={m} uid={`m-${m.id}`} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
            );
          })}
        </ul>

        {/* Side missions: smaller builds */}
        <div className="mt-24">
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <h3 className="font-display text-2xl text-ink sm:text-3xl">Side missions</h3>
            <a
              href="https://github.com/AmoghShukla06?tab=repositories"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 font-hud text-base tracking-wide text-holo hover:text-ink"
            >
              All repositories on GitHub
              <ExternalIcon />
            </a>
          </div>
          <ul className="mt-6 grid border-t border-line sm:grid-cols-2 lg:grid-cols-3">
            {sideMissions.map((s) => (
              <li key={s.title} className="border-b border-line">
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex h-full flex-col gap-1 py-5 pr-6 transition-colors"
                >
                  <span className="flex items-center gap-2 font-hud text-lg font-medium tracking-wide text-ink group-hover:text-holo">
                    {s.title}
                    <Chevron className="h-2.5 w-2.5 text-holo opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />
                  </span>
                  <span className="text-sm leading-6 text-muted">{s.summary}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
