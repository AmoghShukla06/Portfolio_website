import Link from "next/link";
import { GitHubIcon, LinkedInIcon } from "@/components/Icons";
import { links } from "@/data/portfolio";

export default function Footer() {
  return (
    <footer className="relative">
      <section
        id="comms"
        aria-labelledby="comms-title"
        className="relative overflow-hidden border-t border-line py-24 md:py-32"
      >
        {/* the ring rising over the horizon: a thin band of light with a glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-[58%] aspect-square w-[180%] -translate-x-1/2 rounded-full border-t-2 border-holo/50 shadow-[0_-10px_60px_rgba(92,214,255,0.18),inset_0_14px_50px_rgba(92,214,255,0.12)] md:top-[52%] md:w-[130%]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-void via-void/80 to-transparent"
        />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <h2
            id="comms-title"
            className="font-display text-[clamp(2.5rem,7vw,5.5rem)] uppercase leading-none text-ink"
          >
            Comms
          </h2>
          <p className="mt-5 max-w-xl text-lg leading-8 text-muted">
            Hiring, collaborating, or stuck on a hard problem? Send me a message
            on LinkedIn, or look through the code on GitHub.
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <a
              href={links.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="chamfer inline-flex items-center gap-3 bg-holo px-7 py-3.5 font-hud text-lg font-semibold tracking-wide text-void transition-[filter] hover:brightness-110 [--cut:10px]"
            >
              <LinkedInIcon className="h-5 w-5" />
              Message on LinkedIn
            </a>
            <a
              href={links.github}
              target="_blank"
              rel="noopener noreferrer"
              className="panel chamfer inline-flex items-center gap-3 px-7 py-3.5 font-hud text-lg font-medium tracking-wide text-ink transition-colors hover:text-holo [--cut:10px] [--panel-edge:rgba(92,214,255,0.45)]"
            >
              <GitHubIcon className="h-5 w-5" />
              Browse GitHub
            </a>
          </div>
        </div>
      </section>

      <div className="relative border-t border-line bg-void">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-muted sm:px-6 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} Amogh Shukla</p>
          <p className="max-w-2xl md:text-right">
            A fan tribute to the Halo series, which is a trademark of Microsoft;
            not affiliated with Halo Studios. Background art by The Adam Taylor.{" "}
            <Link href="/" className="text-holo underline-offset-4 hover:underline">
              Return to main menu
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
