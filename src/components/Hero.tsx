"use client";

import Image from "next/image";
import { motion, type Variants } from "framer-motion";
import GlassShards from "@/components/GlassShards";
import { missions } from "@/data/portfolio";

const boot: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.2 } },
};

const rise: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.2, 0.7, 0.2, 1] } },
};

// Name wipes in like a HUD element drawing on.
const wipe: Variants = {
  hidden: { clipPath: "inset(-30% 100% -30% -6%)", opacity: 0.4 },
  show: {
    clipPath: "inset(-30% -6% -30% -6%)",
    opacity: 1,
    transition: { duration: 1.1, ease: [0.7, 0, 0.2, 1] },
  },
};

const dossier = [
  { label: "Service tag", value: "AS-06" },
  { label: "Posting", value: "AI Engineer, DeployProAI" },
  { label: "Speciality", value: "LLM tooling, quant systems, search engines" },
  { label: "Base", value: "India" },
  { label: "Missions on file", value: String(missions.length) },
];

export default function Hero() {
  return (
    <section id="top" className="relative flex min-h-[100svh] w-full items-end overflow-hidden">
      <Image
        src="/images/background.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-[60%_40%]"
      />
      {/* legibility: darken the text side and fade into the page */}
      <div className="absolute inset-0 bg-gradient-to-r from-void/95 via-void/55 to-void/10" />
      <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-void to-transparent" />
      <div className="scanlines opacity-60" />
      <div className="absolute inset-0 z-[5]">
        <GlassShards />
      </div>

      <motion.div
        variants={boot}
        initial="hidden"
        animate="show"
        className="relative z-10 mx-auto grid w-full max-w-7xl gap-12 px-4 pb-16 pt-32 sm:px-6 lg:grid-cols-12 lg:items-end lg:pb-24"
      >
        <div className="lg:col-span-7">
          <motion.h1
            variants={wipe}
            className="font-display text-[clamp(3rem,min(11vw,15svh),8.75rem)] uppercase leading-[0.86] text-ink text-glow"
          >
            Amogh
            <br />
            Shukla
          </motion.h1>

          <motion.p
            variants={rise}
            className="mt-6 font-hud text-xl font-medium tracking-wide text-holo sm:text-2xl"
          >
            AI engineer and computer science student
          </motion.p>

          <motion.p variants={rise} className="mt-4 max-w-xl text-base leading-7 text-ink/75 sm:text-lg sm:leading-8">
            I build developer tools around large language models, trading
            platforms that run entirely in the browser, and search engines for
            games like chess. Right now I&apos;m an AI engineer intern at
            DeployProAI.
          </motion.p>

          <motion.div variants={rise} className="mt-9 flex flex-wrap gap-4">
            <a
              href="#campaign"
              className="chamfer inline-flex items-center bg-holo px-7 py-3.5 font-hud text-lg font-semibold tracking-wide text-void transition-[filter,transform] hover:brightness-110 active:translate-y-px [--cut:10px]"
            >
              View projects
            </a>
            <a
              href="#comms"
              className="panel chamfer inline-flex items-center px-7 py-3.5 font-hud text-lg font-medium tracking-wide text-ink transition-colors hover:text-holo [--cut:10px] [--panel-edge:rgba(92,214,255,0.45)]"
            >
              Get in touch
            </a>
          </motion.div>
        </div>

        <motion.aside
          variants={rise}
          aria-label="Profile summary"
          className="panel chamfer hidden self-end lg:col-span-4 lg:col-start-9 lg:block [--cut:18px]"
        >
          <div className="brackets opacity-50" />
          <div className="flex items-center justify-between border-b border-line px-6 py-3">
            <span className="font-hud text-sm tracking-[0.12em] text-muted">Spartan dossier</span>
            <span className="flex items-center gap-2 font-hud text-sm text-visor">
              <span className="radar-blip h-1.5 w-1.5 rounded-full bg-visor" style={{ animationDuration: "2.4s" }} />
              Active
            </span>
          </div>
          <dl className="divide-y divide-line px-6">
            {dossier.map((row) => (
              <div key={row.label} className="grid grid-cols-[8.5rem_1fr] gap-4 py-3">
                <dt className="font-hud text-sm text-muted">{row.label}</dt>
                <dd className="text-[15px] leading-6 text-ink">{row.value}</dd>
              </div>
            ))}
          </dl>
        </motion.aside>
      </motion.div>
    </section>
  );
}
