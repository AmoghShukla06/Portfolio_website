import { handel } from "@/fonts/fonts";
import MetallicBackground from "@/components/MetallicBackground";

type Role = {
  company: string;
  role: string;
  period: string;
  location: string;
  description: string;
  highlights: string[];
};

const experience: Role[] = [
  {
    company: "DeployProAI",
    role: "AI Engineer",
    period: "May 2026 — Present",
    location: "Internship",
    description:
      "Engineered an AI development harness using Claude (Anthropic) to orchestrate LLM-driven software work flows and automate agent tooling",
    highlights: [
      "Built and deployed backend pipelines for LLM integration, optimizing API handling and system reliability to support scalable internal tools.",
      " Improved model integration performance, ensuring stable deployment pipelines for generative AI applications.",
    ],
  },
];

export default function Experience() {
  return (
    <section className="relative w-full overflow-hidden py-24">
      <MetallicBackground />

      <div className="relative z-10 mx-auto max-w-4xl px-6">
        <h2
          className={`${handel.className} mb-16 text-center text-4xl text-[#C0C0C0] sm:text-5xl md:text-6xl`}
        >
          Experience
        </h2>

        <div className="space-y-8">
          {experience.map((job) => (
            <div
              key={job.company}
              className="rounded-2xl border border-white/15 bg-gradient-to-br from-white/[0.1] to-white/[0.03] p-8 shadow-[0_8px_40px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.15)] transition-colors duration-300 hover:border-cyan-300/60 hover:shadow-[0_0_30px_rgba(34,211,238,0.35),inset_0_1px_0_rgba(255,255,255,0.2)]"
            >
              <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                <h3 className={`${handel.className} text-2xl text-[#E5E5E5]`}>
                  {job.company}
                </h3>
                <span className="text-sm uppercase tracking-[0.2em] text-cyan-200/70">
                  {job.period}
                </span>
              </div>

              <div className="mb-4 flex flex-wrap gap-x-4 gap-y-1 text-sm text-cyan-100/80">
                <span>{job.role}</span>
                <span className="text-gray-500">•</span>
                <span>{job.location}</span>
              </div>

              <p className="mb-5 leading-7 text-gray-400">{job.description}</p>

              <ul className="space-y-2">
                {job.highlights.map((point) => (
                  <li
                    key={point}
                    className="flex gap-3 text-sm leading-6 text-gray-300"
                  >
                    <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-cyan-300 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
