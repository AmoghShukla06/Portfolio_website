import type { StaticImageData } from "next/image";
import type { SchematicKind } from "@/components/Schematic";
import academicGuruShot from "../../public/images/project-1.jpg";
import chessShot from "../../public/images/project-2.jpg";
import forteShot from "../../public/images/project-3.jpg";
import quantforgeShot from "../../public/images/projects/quantforge.jpg";
import cpAnalyzerShot from "../../public/images/projects/cp-analyzer.jpg";
import threadAnalyzerShot from "../../public/images/projects/thread-analyzer.jpg";
import zeusShot from "../../public/images/projects/zeus-prompter.jpg";
import jyotishShot from "../../public/images/projects/jyotish-ji.jpg";

export type Mission = {
  id: string;
  title: string;
  tagline: string;
  description: string;
  objectives: string[];
  loadout: string[];
  category: string;
  year: string;
  repoUrl: string | null;
  liveUrl: string | null;
  liveLabel?: string;
  image?: StaticImageData | string;
  schematic: SchematicKind;
  note?: string;
};

// Ordered by depth of engineering, strongest first.
export const missions: Mission[] = [
  {
    id: "chess-engine",
    title: "ChessEngine",
    tagline: "Bitboard chess engine in C++ with a playable Python GUI",
    description:
      "A C++17 bitboard engine bound to Python through pybind11. It searches with PVS alpha-beta, iterative deepening, aspiration windows, null-move pruning, late-move reductions, full static exchange evaluation and a generation-aged transposition table. The GUI adds an eval bar, SAN move list, opening book and PGN export.",
    objectives: [
      "PVS search with null-move, LMR and futility pruning",
      "Move generation perft-verified on five standard positions",
      "+338 Elo in self-play against the previous release",
    ],
    loadout: ["C++17", "Python", "pybind11", "GitHub Actions"],
    category: "Systems",
    year: "2026",
    repoUrl: "https://github.com/AmoghShukla06/ChessEngine",
    liveUrl: "https://github.com/AmoghShukla06/ChessEngine/releases/tag/v1.0",
    liveLabel: "Download v1.0",
    image: chessShot,
    schematic: "chess",
  },
  {
    id: "quantforge",
    title: "QuantForge",
    tagline: "No-code crypto strategy lab that runs entirely in the browser",
    description:
      "Strategies are built as a visual node graph and fed to a backtest engine, grid-search optimizer and Monte Carlo simulator that run off the main thread in a Web Worker. It models perpetual-futures funding, leverage and liquidations, prices options with Black-Scholes, and keeps every byte of data local in IndexedDB.",
    objectives: [
      "Node-graph (DAG) strategy builder, no code required",
      "Black-Scholes options pricing with full Greeks",
      "Monte Carlo bootstrap of trade returns",
    ],
    loadout: ["Next.js", "TypeScript", "Web Workers", "IndexedDB", "Binance API"],
    category: "Quant & trading",
    year: "2026",
    repoUrl: "https://github.com/AmoghShukla06/tradingApp",
    liveUrl: "https://algo-builder-8lpi.vercel.app/",
    liveLabel: "Open live app",
    image: quantforgeShot,
    schematic: "candles",
  },
  {
    id: "forte",
    title: "Forte",
    tagline: "AI studio that turns a plain-language brief into a landing page",
    description:
      "The backend compresses a structured brief into a single prompt so the model writes only the page component, then compile-checks it with TypeScript and feeds errors back for up to two repair rounds. The studio renders a sandboxed preview, sends runtime errors back for auto-fix, and exports a ready-to-run Next.js project.",
    objectives: [
      "TypeScript compile gate with automatic repair",
      "Truncation recovery stitches cut-off model output",
      "Model fallback routing through OpenRouter",
    ],
    loadout: ["Next.js", "React", "Express", "TypeScript", "OpenRouter"],
    category: "AI / LLM",
    year: "2026",
    repoUrl: "https://github.com/AmoghShukla06/PageForge",
    liveUrl: null,
    image: forteShot,
    schematic: "wireframe",
  },
  {
    id: "zeus-prompter",
    title: "ZeusPrompter",
    tagline: "Rewrites prompts for AI coding agents using your project's context",
    description:
      "One installer wires prompt-submit hooks into Claude Code, Codex CLI, Cursor and Antigravity. Each prompt is enriched from a per-project knowledge base and rewritten through an OpenRouter model; a session-end hook summarises the git diff back into that knowledge base. Any failure passes the original prompt through untouched.",
    objectives: [
      "One installer covers four AI coding tools",
      "Self-updating per-project knowledge base",
      "Fail-open design: errors never block a prompt",
    ],
    loadout: ["Python", "OpenRouter", "Qwen3-Coder", "Claude Code hooks", "Git"],
    category: "AI / LLM",
    year: "2026",
    repoUrl: "https://github.com/AmoghShukla06/ZeusPrompter",
    liveUrl: null,
    image: zeusShot,
    schematic: "neural",
  },
  {
    id: "cp-analyzer",
    title: "CP Analyzer",
    tagline: "Compiles, tests and profiles competitive-programming solutions",
    description:
      "A C++ HTTP server compiles submitted code, runs it against generated tests with timeouts, and estimates time and space complexity from static cues plus a log-log fit of measured runtime and memory. A GDB Python script steps through execution to capture per-line variable state, and a local model suggests optimisations.",
    objectives: [
      "Empirical Big-O from a log-log runtime fit",
      "Line-by-line execution tracing through GDB",
      "Local LLM optimisation hints via Ollama",
    ],
    loadout: ["C++17", "cpp-httplib", "GDB", "Ollama", "React", "Monaco"],
    category: "Systems",
    year: "2026",
    repoUrl: "https://github.com/AmoghShukla06/Code_Analyzer",
    liveUrl: null,
    image: cpAnalyzerShot,
    schematic: "terminal",
  },
  {
    id: "thread-analyzer",
    title: "Thread Analyzer",
    tagline: "Chrome extension that reads the sentiment and sarcasm of a thread",
    description:
      "A Manifest V3 extension collects visible comments from X, Instagram and Reddit and sends them to a FastAPI backend that batch-runs DistilBERT sentiment and a RoBERTa irony model. Low-confidence sarcasm calls fall back to heuristic cues or are marked uncertain, and the popup charts the results.",
    objectives: [
      "Reads threads on X, Instagram and Reddit",
      "DistilBERT sentiment plus RoBERTa irony detection",
      "Heuristic fallback when the model is unsure",
    ],
    loadout: ["Chrome MV3", "FastAPI", "PyTorch", "Hugging Face", "Chart.js"],
    category: "AI / ML",
    year: "2026",
    repoUrl: "https://github.com/AmoghShukla06/threadAnalyzer",
    liveUrl: null,
    image: threadAnalyzerShot,
    schematic: "dashboard",
  },
  {
    id: "jyotish-ji",
    title: "Jyotish Ji",
    tagline: "Vedic astrology app with exact chart maths and LLM readings",
    description:
      "A Flutter app backed by FastAPI computes Vedic charts — ascendant, nakshatra, Vimshottari dashas — with Swiss Ephemeris, then hands the computed chart to Llama 3.1 8B on Ollama for interpretation. Planetary positions are never left to the model.",
    objectives: [
      "Swiss Ephemeris chart computation",
      "Llama 3.1 8B readings served by Ollama",
      "JWT auth, SQLite and a Dockerised backend",
    ],
    loadout: ["Flutter", "Dart", "FastAPI", "Swiss Ephemeris", "Ollama"],
    category: "Mobile",
    year: "2026",
    repoUrl: "https://github.com/AmoghShukla06/Jyotish-Ji",
    liveUrl: null,
    image: jyotishShot,
    schematic: "mobile",
  },
  {
    id: "academic-guru",
    title: "Academic Guru",
    tagline: "Official website for a coaching institute, classes 6–12",
    description:
      "Designed and built the official site for Academic Guru, an educational institute: courses, results, facilities and admissions, in English and Hindi. Built with Next.js and React, with a responsive interface focused on performance and accessibility.",
    objectives: [
      "English and Hindi versions of every page",
      "Responsive layouts for courses, results and gallery",
      "Live in production for students and parents",
    ],
    loadout: ["Next.js", "React", "Tailwind CSS"],
    category: "Client web",
    year: "2026",
    repoUrl: null,
    liveUrl: "https://www.theacademicguru.org",
    liveLabel: "Visit site",
    image: academicGuruShot,
    schematic: "wireframe",
  },
];

export type SideMission = { title: string; summary: string; url: string };

export const sideMissions: SideMission[] = [
  {
    title: "AirWatch NCR",
    summary: "Climate hackathon build: an air-quality map and live feed for Delhi NCR.",
    url: "https://github.com/AmoghShukla06/Climate_Hackathon",
  },
  {
    title: "Transit Ops",
    summary: "Fleet operations dashboard with role-based access control.",
    url: "https://github.com/AmoghShukla06/transit_ops_project",
  },
  {
    title: "Luggage Dashboard",
    summary: "Scrapes Amazon brand and product data into a React dashboard.",
    url: "https://github.com/AmoghShukla06/luggageDashboard",
  },
  {
    title: "Portable LLM",
    summary: "Runs a local model from the terminal on top of llama.cpp.",
    url: "https://github.com/AmoghShukla06/portable_llm",
  },
  {
    title: "Binance Trading Bot",
    summary: "Command-line order placement against the Binance testnet.",
    url: "https://github.com/AmoghShukla06/Binance_Trading_Bot",
  },
  {
    title: "Amo Odyssey",
    summary: "A game built in Unity.",
    url: "https://github.com/AmoghShukla06/amo-odyssey",
  },
];

export type Posting = {
  unit: string;
  role: string;
  period: string;
  kind: string;
  summary: string;
  commendations: string[];
};

export const serviceRecord: Posting[] = [
  {
    unit: "DeployProAI",
    role: "AI Engineer",
    period: "May 2026 – present",
    kind: "Internship",
    summary:
      "Engineered an AI development harness on Claude (Anthropic) that orchestrates LLM-driven software workflows and automates agent tooling.",
    commendations: [
      "Built and deployed backend pipelines for LLM integration, tuning API handling and reliability for scalable internal tools.",
      "Improved model-integration performance and kept deployment pipelines for generative AI applications stable.",
    ],
  },
];

export type Slot = {
  slot: string;
  name: string;
  items: string[];
};

// Halo loadout slots mapped to what each group of tools is used for.
export const loadout: Slot[] = [
  {
    slot: "Primary weapon",
    name: "Languages",
    items: ["TypeScript", "Python", "C++", "JavaScript", "Dart"],
  },
  {
    slot: "Secondary",
    name: "Frameworks",
    items: ["Next.js", "React", "FastAPI", "Express", "Flutter", "Tailwind CSS"],
  },
  {
    slot: "Armor ability",
    name: "AI and ML",
    items: ["Claude API", "OpenRouter", "Ollama", "Hugging Face", "PyTorch", "Agent hooks"],
  },
  {
    slot: "Equipment",
    name: "Systems and tools",
    items: ["Search algorithms", "Bitboards", "Web Workers", "GDB", "Playwright", "Docker"],
  },
];

export const links = {
  github: "https://github.com/AmoghShukla06",
  linkedin: "https://www.linkedin.com/in/amogh-shukla-2845902a0/",
};
