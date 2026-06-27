import { handel } from "@/fonts/fonts";
import MetallicBackground from "@/components/MetallicBackground";

type Project = {
  title: string;
  description: string;
  image: string;
  tags: string[];
  link: string;
};

const projects: Project[] = [
  {
    title: "Academic Guru Website",
    description:
      "Designed and developed the official website for Academic Guru, an educational institution. Built using Next.js and React with a modern, responsive interface focused on performance, accessibility, and user experience.",
    image: "/images/project-1.jpg",
    tags: ["Next.js", "React"],
    link: "https://www.theacademicguru.org",
  },
  {
    title: "Python Chess Engine",
    description:
      "Developed a high-performance chess engine using C++ and Python Tkinter. Implemented Bitboards for efficient board representation, Quiescence Search for stronger move evaluation, and Zobrist Hashing for fast transposition table lookups.",
    image: "/images/project-2.jpg",
    tags: [
      "C++",
      "Python",
      "Tkinter",
      "Bitboards",
      "Quiescence Search",
      "Zobrist Hashing",
    ],
    link: "https://github.com/AmoghShukla06/PythonChessEngine",
  },
  {
    title: "Forte: AI Landing-Page Studio",
    description:
      "Developed a full-stack application that generates production-ready React/Tailwind landing pages from structured briefs using OpenRouter APIs. Engineered a reliability pipeline with server-side TypeScript compile checking, truncation recovery, automated runtime debugging, and an in-browser editor powered by Babel JSX instrumentation supporting instant edits with full undo/redo.",
    image: "/images/project-3.jpg",
    tags: [
      "Next.js",
      "TypeScript",
      "Node.js",
      "Tailwind CSS",
      "OpenRouter API",
      "Babel",
    ],
    link: "https://github.com/AmoghShukla06/PageForge",
  },
];

export default function Projects() {
  return (
    <section className="relative w-full overflow-hidden py-24">
      <MetallicBackground />

      <div className="relative z-10 mx-auto max-w-6xl px-6">
        <h2
          className={`${handel.className} mb-16 text-center text-4xl text-[#C0C0C0] sm:text-5xl md:text-6xl`}
        >
          Projects
        </h2>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <a
              key={project.title}
              href={project.link}
              target="_blank"
              rel="noopener noreferrer"
              className="group block rounded-2xl border border-white/15 bg-gradient-to-br from-white/[0.1] to-white/[0.03] p-5 shadow-[0_8px_40px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.15)] transition-all duration-300 hover:-translate-y-2 hover:border-cyan-300/60 hover:shadow-[0_0_30px_rgba(34,211,238,0.35),inset_0_1px_0_rgba(255,255,255,0.2)]"
            >
              {/* Project Image */}
              <div
                className="relative mb-5 aspect-video overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-[#1a1a1f] to-[#0a0a0c] bg-cover bg-center"
                style={{
                  backgroundImage: `url('${project.image}')`,
                }}
              />

              {/* Title */}
              <h3
                className={`${handel.className} mb-3 text-2xl text-[#E5E5E5] group-hover:text-cyan-200 transition-colors`}
              >
                {project.title}
              </h3>

              {/* Description */}
              <p className="mb-5 text-sm leading-6 text-gray-400">
                {project.description}
              </p>

              {/* Tech Stack */}
              <div className="mb-5 flex flex-wrap gap-2">
                {project.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-cyan-300/30 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-200"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Visit Button */}
              <div className="mt-auto flex justify-end">
                <span className="rounded-lg border border-cyan-300/40 px-4 py-2 text-sm text-cyan-200 transition-colors group-hover:bg-cyan-300/10">
                  View Project →
                </span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}