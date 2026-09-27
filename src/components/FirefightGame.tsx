"use client";

import { useEffect, useRef, useState } from "react";
import {
  initAudio, play, setAlarm, setMuted, isMuted, suspendAudio, resumeAudio, type Sfx,
} from "@/components/firefightAudio";

type Phase = "ready" | "playing" | "paused" | "over";
type Ctx = CanvasRenderingContext2D;

const BEST_KEY = "firefight-best";
const MAG = 32;
const RELOAD = 1.4;
const DIE = 0.55;
const SPAWN = 0.6;
const NADE_T = 0.7;
const BLAST_T = 0.5;
const MAX_ENEMIES = 16;
const MAX_BOLTS = 48;
const MAX_PARTS = 260;
const TAU = Math.PI * 2;
const HOLO = "#5cd6ff";
const VISOR = "#f2a93b";
const RED = "#ff4b3e";
const INK = "#dde7f0";
const MUTED = "#7d8fa3";
const CONFETTI = ["#ff4fa3", "#ffd23f", "#4fe3ff", "#7dff6a", "#b57bff", "#ff8a3d"];

/* enemy kinds */
const GRUNT = 0, ELITE = 1, JACKAL = 2, DRONE = 3;
/* enemy states */
const FIGHT = 0, PANIC = 2, BERSERK = 3, DIVE = 4;
const SPD = [0.12, 0.1, 0.11, 0.17];
const LAT_MAX = [0.34, 0.3, 0.42, 0.75];
const W_LAT = [2.6, 2.1, 3, 3.8];
const STRAFE = [0.1, 0.14, 0.12, 0.12];
const STRIDE = [9, 20, 13, 1];
const BOB = [2.5, 3, 5, 0];
const DMIN = [0.55, 0.5, 0.45, 0.22];
const DMAX = [0.8, 0.72, 0.68, 0.48];
const HALF = [30, 57, 46, 0];
const SCORE = [100, 250, 150, 120];
const BOLT_T = [0.6, 0.5, 0.42, 0.45];
const FIRE_CD = [1.6, 1.8, 1.3, 1.9];
const KILLED = ["Killed Grunt", "Killed Elite", "Killed Jackal", "Killed Drone"];
const DEATH_SFX: Sfx[] = ["gruntDeath", "eliteDeath", "jackalDeath", "droneDeath"];
const FIRE_SFX: Sfx[] = ["plasmaGrunt", "plasmaElite", "needle", "plasmaGrunt"];
const BLOOD = ["#7fc4ff", "#b58cff", "#c98bff", "#b8e07a"];
const DEBRIS = ["#334058", "#1a2140", "#5b3f86", "#3d4a28"];

interface Enemy {
  on: boolean; kind: number; state: number;
  d: number; vd: number; td: number; ex: number; vx: number; tex: number; alt: number; talt: number;
  ph: number; freq: number; amp: number; tacT: number; diveT: number;
  hp: number; shield: number; panicT: number; fireT: number; burst: number;
  flash: number; shimmer: number; breakT: number; dieT: number; dir: number; side: number;
  spawnT: number; tilt: number; lean: number; dodgeT: number; dodgeCd: number;
  rip: number; ripX: number; ripY: number; stride: number; move: number; bob: number;
  sx: number; sy: number; sc: number;
}
interface Bolt {
  on: boolean; kind: number; hit: boolean; t: number; dur: number; dmg: number;
  x0: number; y0: number; cx: number; cy: number; x1: number; y1: number;
}
interface Particle {
  on: boolean; x: number; y: number; vx: number; vy: number; life: number; max: number;
  c: string; sz: number; confetti: boolean; rot: number; vr: number;
}
interface Nade { on: boolean; t: number; x0: number; y0: number; x1: number; y1: number }
interface Blast { on: boolean; t: number; x: number; y: number; r: number }
interface Medal { text: string; t: number }
interface Feed { text: string; t: number; c: string }

interface Game {
  canvas: HTMLCanvasElement; ctx: Ctx; bg: HTMLCanvasElement;
  glows: HTMLCanvasElement[]; glowO: HTMLCanvasElement; col: HTMLCanvasElement; disc: HTMLCanvasElement;
  vigB: HTMLCanvasElement; vigR: HTMLCanvasElement;
  W: number; H: number; dpr: number; k: number; ek: number; hy: number;
  fam: string; fXs: string; fSm: string; fMd: string; fLg: string; fXl: string;
  reduced: boolean; started: boolean; touch: boolean;
  enemies: Enemy[]; bolts: Bolt[]; parts: Particle[]; pi: number; medals: Medal[]; feed: Feed[];
  grenades: Nade[]; blasts: Blast[]; nades: number;
  t: number; px: number; py: number; hasPointer: boolean; firing: boolean; pending: boolean;
  hover: boolean; head: boolean; block: boolean; rx: number; ry: number; qx: number; qy: number; hitT: number;
  cool: number; bloom: number; ammo: number; reload: number; muzzle: number; tx: number; ty: number;
  shield: number; health: number; sinceHit: number; shieldFlash: number; healthFlash: number; shake: number;
  recharging: boolean; alarm: boolean;
  wave: number; waveState: number; banner: string; sub: string; bannerT: number;
  queue: number[]; qi: number; spawnT: number; remaining: number;
  score: number; kills: number; medalCount: number; multi: number; lastKill: number; spree: number;
}

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
const panOf = (g: Game, x: number) => clamp((x / g.W) * 2 - 1, -1, 1);

function readBest(): number {
  try {
    return Number(window.localStorage.getItem(BEST_KEY)) || 0;
  } catch {
    return 0;
  }
}
function writeBest(v: number) {
  try {
    window.localStorage.setItem(BEST_KEY, String(v));
  } catch {
    /* storage unavailable */
  }
}

function makeCanvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}
function ctxOf(c: HTMLCanvasElement) {
  return c.getContext("2d") as Ctx;
}
function makeGlow(rgb: string) {
  const c = makeCanvas(64, 64);
  const x = ctxOf(c);
  const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, "rgba(255,255,255,1)");
  gr.addColorStop(0.2, `rgba(${rgb},1)`);
  gr.addColorStop(0.5, `rgba(${rgb},0.35)`);
  gr.addColorStop(1, `rgba(${rgb},0)`);
  x.fillStyle = gr;
  x.fillRect(0, 0, 64, 64);
  return c;
}
function makeVignette(rgb: string) {
  const c = makeCanvas(256, 256);
  const x = ctxOf(c);
  const gr = x.createRadialGradient(128, 128, 60, 128, 128, 182);
  gr.addColorStop(0, `rgba(${rgb},0)`);
  gr.addColorStop(0.55, `rgba(${rgb},0.25)`);
  gr.addColorStop(1, `rgba(${rgb},0.9)`);
  x.fillStyle = gr;
  x.fillRect(0, 0, 256, 256);
  return c;
}
/** Teleport shimmer column: bright core fading to the edges and the ends. */
function makeColumn() {
  const c = makeCanvas(32, 128);
  const x = ctxOf(c);
  let gr = x.createLinearGradient(0, 0, 32, 0);
  gr.addColorStop(0, "rgba(143,233,255,0)");
  gr.addColorStop(0.4, "rgba(143,233,255,0.7)");
  gr.addColorStop(0.5, "rgba(255,255,255,1)");
  gr.addColorStop(0.6, "rgba(143,233,255,0.7)");
  gr.addColorStop(1, "rgba(143,233,255,0)");
  x.fillStyle = gr;
  x.fillRect(0, 0, 32, 128);
  x.globalCompositeOperation = "destination-in";
  gr = x.createLinearGradient(0, 0, 0, 128);
  gr.addColorStop(0, "rgba(0,0,0,0)");
  gr.addColorStop(0.3, "rgba(0,0,0,0.8)");
  gr.addColorStop(0.9, "rgba(0,0,0,1)");
  gr.addColorStop(1, "rgba(0,0,0,0.2)");
  x.fillStyle = gr;
  x.fillRect(0, 0, 32, 128);
  return c;
}
/** Jackal energy shield disc (orange core, purple rim). */
function makeDisc() {
  const c = makeCanvas(96, 96);
  const x = ctxOf(c);
  const gr = x.createRadialGradient(40, 40, 2, 48, 48, 48);
  gr.addColorStop(0, "rgba(255,210,120,0.75)");
  gr.addColorStop(0.45, "rgba(255,140,70,0.45)");
  gr.addColorStop(0.85, "rgba(170,80,220,0.4)");
  gr.addColorStop(1, "rgba(150,60,220,0)");
  x.fillStyle = gr;
  x.beginPath();
  x.arc(48, 48, 48, 0, TAU);
  x.fill();
  return c;
}

function newEnemy(): Enemy {
  return {
    on: false, kind: GRUNT, state: FIGHT, d: 0, vd: 0, td: 0.7, ex: 0, vx: 0, tex: 0, alt: 0, talt: 0,
    ph: 0, freq: 1, amp: 0, tacT: 0, diveT: 0, hp: 1, shield: 0, panicT: 0, fireT: 0, burst: 0,
    flash: 0, shimmer: 0, breakT: 0, dieT: 0, dir: 1, side: 1, spawnT: 0, tilt: 0, lean: 0, dodgeT: 0, dodgeCd: 0,
    rip: 0, ripX: 0, ripY: 0, stride: 0, move: 0, bob: 0, sx: 0, sy: 0, sc: 1,
  };
}

function createGame(canvas: HTMLCanvasElement, ctx: Ctx): Game {
  const root = getComputedStyle(document.documentElement).getPropertyValue("--font-barlow-condensed").trim();
  const enemies: Enemy[] = [];
  for (let i = 0; i < MAX_ENEMIES; i++) enemies.push(newEnemy());
  const bolts: Bolt[] = [];
  for (let i = 0; i < MAX_BOLTS; i++)
    bolts.push({ on: false, kind: 0, hit: false, t: 0, dur: 1, dmg: 0, x0: 0, y0: 0, cx: 0, cy: 0, x1: 0, y1: 0 });
  const parts: Particle[] = [];
  for (let i = 0; i < MAX_PARTS; i++)
    parts.push({ on: false, x: 0, y: 0, vx: 0, vy: 0, life: 0, max: 1, c: HOLO, sz: 2, confetti: false, rot: 0, vr: 0 });
  const grenades: Nade[] = [];
  const blasts: Blast[] = [];
  for (let i = 0; i < 3; i++) {
    grenades.push({ on: false, t: 0, x0: 0, y0: 0, x1: 0, y1: 0 });
    blasts.push({ on: false, t: 0, x: 0, y: 0, r: 1 });
  }
  const glowO = makeGlow("255,170,60");
  return {
    canvas, ctx, bg: makeCanvas(1, 1),
    glows: [makeGlow("125,255,106"), makeGlow("143,123,255"), makeGlow("255,90,200"), glowO],
    glowO, col: makeColumn(), disc: makeDisc(),
    vigB: makeVignette("92,214,255"), vigR: makeVignette("255,42,31"),
    W: 1, H: 1, dpr: 1, k: 1, ek: 1, hy: 0,
    fam: root ? `${root}, sans-serif` : "sans-serif", fXs: "", fSm: "", fMd: "", fLg: "", fXl: "",
    reduced: window.matchMedia("(prefers-reduced-motion: reduce)").matches, started: false, touch: false,
    enemies, bolts, parts, pi: 0, medals: [], feed: [], grenades, blasts, nades: 2,
    t: 0, px: 0, py: 0, hasPointer: false, firing: false, pending: false,
    hover: false, head: false, block: false, rx: 0, ry: 0, qx: 0, qy: 0, hitT: 0,
    cool: 0, bloom: 0, ammo: MAG, reload: 0, muzzle: 0, tx: 0, ty: 0,
    shield: 100, health: 100, sinceHit: 99, shieldFlash: 0, healthFlash: 0, shake: 0, recharging: false, alarm: false,
    wave: 1, waveState: 0, banner: "", sub: "", bannerT: 0, queue: [], qi: 0, spawnT: 0, remaining: 0,
    score: 0, kills: 0, medalCount: 0, multi: 0, lastKill: -99, spree: 0,
  };
}

function sizeGame(g: Game, w: number, h: number) {
  g.W = Math.max(1, w);
  g.H = Math.max(1, h);
  g.dpr = Math.min(1.5, window.devicePixelRatio || 1);
  g.canvas.width = Math.round(g.W * g.dpr);
  g.canvas.height = Math.round(g.H * g.dpr);
  g.k = clamp(g.H / 450, 0.72, 1.6);
  g.ek = g.H / 400;
  g.hy = g.H * 0.42;
  const f = (wt: number, s: number) => `${wt} ${Math.round(s * g.k)}px ${g.fam}`;
  g.fXs = f(600, 12);
  g.fSm = f(600, 15);
  g.fMd = f(700, 19);
  g.fLg = f(700, 36);
  g.fXl = f(700, 44);
  if (!g.hasPointer) {
    g.px = g.W / 2;
    g.py = g.H * 0.55;
  }
  buildBackground(g);
}

function buildBackground(g: Game) {
  const { W, H, dpr, hy } = g;
  const c = g.bg;
  c.width = Math.round(W * dpr);
  c.height = Math.round(H * dpr);
  const x = ctxOf(c);
  x.setTransform(dpr, 0, 0, dpr, 0, 0);
  let gr = x.createLinearGradient(0, 0, 0, hy);
  gr.addColorStop(0, "#03060b");
  gr.addColorStop(1, "#0a1422");
  x.fillStyle = gr;
  x.fillRect(0, 0, W, hy + 1);
  for (let i = 0; i < 320; i++) {
    const a = Math.random();
    x.fillStyle = `rgba(220,235,255,${(0.12 + a * 0.7).toFixed(2)})`;
    const s = a > 0.94 ? 1.7 : 1;
    x.fillRect(Math.random() * W, Math.random() * hy, s, s);
  }
  const glow = x.createRadialGradient(W * 0.5, hy, 0, W * 0.5, hy, W * 0.6);
  glow.addColorStop(0, "rgba(92,214,255,0.10)");
  glow.addColorStop(1, "rgba(92,214,255,0)");
  x.fillStyle = glow;
  x.fillRect(0, 0, W, hy);
  // Halo ring rising from the horizon
  const cx = W * 0.63, cy = hy + H * 0.04, rx = W * 0.2, ry = H * 0.9, band = Math.max(8, W * 0.026);
  x.save();
  x.beginPath();
  x.rect(0, 0, W, hy);
  x.clip();
  const arc = (dr: number, lw: number, style: string) => {
    x.beginPath();
    x.ellipse(cx, cy, rx + dr, ry + dr, -0.1, Math.PI, TAU);
    x.lineWidth = lw;
    x.strokeStyle = style;
    x.stroke();
  };
  arc(0, band * 3.2, "rgba(159,216,255,0.05)");
  arc(0, band, "rgba(159,216,255,0.24)");
  arc(-band * 0.3, band * 0.4, "rgba(16,34,56,0.6)");
  for (let i = 0; i < 6; i++) arc((i - 2.5) * band * 0.15, 1, `rgba(200,236,255,${i % 2 ? 0.28 : 0.12})`);
  x.setLineDash([1.5, band * 0.7]);
  arc(0, band * 0.9, "rgba(8,16,28,0.4)");
  x.setLineDash([]);
  arc(band * 0.5, 1.2, "rgba(230,248,255,0.45)");
  x.restore();
  const ridge = (base: number, amp: number, seed: number, col: string, rim: boolean) => {
    x.beginPath();
    x.moveTo(0, hy + 1);
    for (let px = 0; px <= W + W / 80; px += W / 80) {
      const n = px / W;
      const h = Math.sin(n * 9 + seed) * 0.5 + Math.sin(n * 23 + seed * 2) * 0.25 + Math.sin(n * 51 + seed * 3) * 0.12;
      x.lineTo(px, hy - base - Math.abs(h) * amp);
    }
    x.lineTo(W, hy + 1);
    x.closePath();
    x.fillStyle = col;
    x.fill();
    if (rim) {
      x.strokeStyle = "rgba(92,214,255,0.14)";
      x.lineWidth = 1;
      x.stroke();
    }
  };
  ridge(H * 0.02, H * 0.1, 1.3, "#0b1728", true);
  ridge(H * 0.004, H * 0.055, 4.1, "#060c16", false);
  gr = x.createLinearGradient(0, hy, 0, H);
  gr.addColorStop(0, "#07101c");
  gr.addColorStop(1, "#03060b");
  x.fillStyle = gr;
  x.fillRect(0, hy, W, H - hy);
  x.strokeStyle = "rgba(92,214,255,0.12)";
  x.lineWidth = 1;
  x.beginPath();
  for (let i = -16; i <= 16; i++) {
    x.moveTo(W / 2 + i * W * 0.012, hy);
    x.lineTo(W / 2 + i * W * 0.16, H);
  }
  for (let i = 1; i < 30; i++) {
    const d = i / 16;
    const y = hy + Math.pow(d, 1.6) * (H * 0.92 - hy);
    if (y > H) break;
    x.moveTo(0, y);
    x.lineTo(W, y);
  }
  x.stroke();
  gr = x.createLinearGradient(0, hy, 0, hy + H * 0.12);
  gr.addColorStop(0, "rgba(8,16,28,0.9)");
  gr.addColorStop(1, "rgba(8,16,28,0)");
  x.fillStyle = gr;
  x.fillRect(0, hy, W, H * 0.12);
  x.fillStyle = "rgba(92,214,255,0.25)";
  x.fillRect(0, hy, W, 1);
}

/* ---------- simulation ---------- */

function resetGame(g: Game) {
  g.started = true;
  g.t = 0;
  for (const e of g.enemies) e.on = false;
  for (const b of g.bolts) b.on = false;
  for (const p of g.parts) p.on = false;
  for (const n of g.grenades) n.on = false;
  for (const b of g.blasts) b.on = false;
  g.medals.length = 0;
  g.feed.length = 0;
  g.shield = 100; g.health = 100; g.sinceHit = 99; g.shieldFlash = 0; g.healthFlash = 0; g.shake = 0;
  g.recharging = false; g.alarm = false; g.hitT = 0;
  g.ammo = MAG; g.reload = 0; g.cool = 0; g.bloom = 0; g.firing = false; g.pending = false; g.muzzle = 0;
  g.score = 0; g.kills = 0; g.medalCount = 0; g.multi = 0; g.lastKill = -99; g.spree = 0;
  startWave(g, 1);
}

function startWave(g: Game, n: number) {
  g.wave = n;
  g.nades = 2;
  const total = 5 + 3 * n;
  const q = g.queue;
  q.length = 0;
  for (let i = 0; i < total; i++) q.push(GRUNT);
  const place = (kind: number, count: number) => {
    for (let c = 0; c < count; c++) {
      for (let tries = 0; tries < 30; tries++) {
        const i = 2 + Math.floor(Math.random() * (total - 2));
        if (q[i] === GRUNT) { q[i] = kind; break; }
      }
    }
  };
  place(ELITE, Math.min(6, Math.ceil(n / 2)));
  if (n >= 2) place(JACKAL, Math.min(6, n - 1));
  if (n >= 3) place(DRONE, Math.min(6, n - 1));
  g.qi = 0;
  g.spawnT = 1.2;
  g.waveState = 1;
  g.banner = `WAVE ${n}`;
  g.sub = n === 1 ? "Hostiles inbound" : n === 2 ? "Jackals inbound" : n === 3 ? "Drones inbound" : "Reinforcements inbound";
  g.bannerT = 1.8;
  play("waveStart");
}

function project(g: Game, e: Enemy) {
  const d = Math.min(e.d, 1.15);
  e.sy = g.hy + Math.pow(d, 1.6) * (g.H * 0.92 - g.hy);
  e.sc = (0.12 + d * 0.95) * g.ek * 0.9;
  e.sx = g.W / 2 + e.ex * g.W * 0.46 * (0.25 + 0.75 * d);
  if (e.kind === DRONE) e.sy -= e.alt * g.H;
}

/** Pick a lateral spot that keeps the squad spread out, plus a depth in the kind's band. */
function retarget(g: Game, e: Enemy) {
  const kd = e.kind;
  e.tacT = kd === DRONE ? rand(0.7, 1.4) : rand(1.5, 3);
  let best = 0, bestScore = -1;
  for (let c = 0; c < 3; c++) {
    const cand = rand(-0.8, 0.8);
    let m = 9;
    for (const o of g.enemies) {
      if (o === e || !o.on || o.dieT > 0) continue;
      const dd = Math.abs(o.tex - cand) + Math.abs(o.d - e.d) * 1.5;
      if (dd < m) m = dd;
    }
    if (m > bestScore) { bestScore = m; best = cand; }
  }
  e.tex = best;
  const push = Math.min(0.08, (g.wave - 1) * 0.01);
  e.td = rand(DMIN[kd], DMAX[kd]) + push;
  if (kd === DRONE) e.talt = rand(0.14, 0.28);
}

function spawnEnemy(g: Game, kind: number) {
  let e: Enemy | null = null;
  for (const c of g.enemies) if (!c.on) { e = c; break; }
  if (!e) return;
  const n = g.wave;
  e.on = true; e.kind = kind; e.state = FIGHT; e.d = 0.02; e.vd = 0; e.vx = 0;
  e.dieT = 0; e.flash = 0; e.shimmer = 0; e.breakT = 0; e.rip = 0; e.tilt = 0; e.lean = 0; e.dodgeT = 0; e.dodgeCd = 0;
  e.spawnT = SPAWN; e.stride = rand(0, TAU); e.move = 0; e.bob = 0; e.amp = 0;
  e.ph = rand(0, TAU); e.freq = rand(0.9, 1.6);
  e.dir = Math.random() < 0.5 ? -1 : 1; e.side = Math.random() < 0.5 ? -1 : 1;
  retarget(g, e);
  e.ex = e.tex; e.tacT = rand(0.8, 1.6);
  e.alt = kind === DRONE ? rand(0.2, 0.3) : 0; e.talt = e.alt;
  e.diveT = rand(2.5, 4.5);
  e.hp = kind === DRONE ? 1 : 2;
  e.shield = kind === ELITE ? 4 + Math.min(4, Math.floor(n / 2)) : 0;
  e.fireT = rand(0.6, 1.4);
  e.burst = 0;
  project(g, e);
}

const byDepth = (a: Enemy, b: Enemy) => (a.on ? a.d : -1) - (b.on ? b.d : -1);

function hitTest(g: Game, x: number, y: number): Enemy | null {
  g.head = false;
  g.block = false;
  for (let i = g.enemies.length - 1; i >= 0; i--) {
    const e = g.enemies[i];
    if (!e.on || e.dieT > 0 || e.spawnT > 0.25) continue;
    const lx = (x - e.sx) / e.sc, ly = (y - e.sy) / e.sc - e.bob;
    if (e.kind === GRUNT) {
      if (lx >= -19 && lx <= 19 && ly >= -60 && ly <= 0) { g.head = ly <= -42; return e; }
    } else if (e.kind === ELITE) {
      const top = e.state === BERSERK ? -132 : -116;
      if (lx >= -24 && lx <= 24 && ly >= top && ly <= 0) { g.head = ly <= -89 && ly >= -116; return e; }
    } else if (e.kind === JACKAL) {
      const mx = lx * e.side, sx = (mx + 20) / 24, sy = (ly + 52) / 30;
      if (sx * sx + sy * sy <= 1) { g.block = true; g.rx = mx; g.ry = ly; return e; }
      const hx = (mx - 8) / 12, hyy = (ly + 84) / 9;
      if (hx * hx + hyy * hyy <= 1) { g.head = true; return e; }
      if (mx >= -10 && mx <= 22 && ly >= -78 && ly <= 0) return e;
    } else if (lx >= -15 && lx <= 15 && ly >= -15 && ly <= 15) return e;
  }
  return null;
}

function part(g: Game) {
  const p = g.parts[g.pi];
  g.pi = (g.pi + 1) % MAX_PARTS;
  return p;
}
function burst(g: Game, x: number, y: number, n: number, c: string, life: number, size = 1) {
  for (let i = 0; i < n; i++) {
    const p = part(g), a = rand(0, TAU), s = rand(60, 260) * g.k;
    p.on = true; p.x = x; p.y = y; p.vx = Math.cos(a) * s; p.vy = Math.sin(a) * s - 60 * g.k;
    p.life = p.max = life * rand(0.6, 1); p.c = c; p.sz = rand(1.5, 3) * g.k * size; p.confetti = false;
  }
}
function confetti(g: Game, x: number, y: number) {
  for (let i = 0; i < 26; i++) {
    const p = part(g);
    p.on = true; p.x = x; p.y = y; p.vx = rand(-230, 230) * g.k; p.vy = rand(-430, -150) * g.k;
    p.life = p.max = rand(1.1, 1.8); p.c = CONFETTI[i % CONFETTI.length]; p.sz = rand(3, 6) * g.k;
    p.confetti = true; p.rot = rand(0, TAU); p.vr = rand(-12, 12);
  }
}

function addFeed(g: Game, text: string, c: string) {
  g.feed.unshift({ text, t: 0, c });
  if (g.feed.length > 4) g.feed.pop();
}
function addMedal(g: Game, text: string, pts: number, sfx = true) {
  g.score += pts;
  g.medalCount++;
  g.medals.unshift({ text, t: 0 });
  if (g.medals.length > 3) g.medals.pop();
  if (sfx) play("medal", { volume: 0.55 });
}

function goBerserk(g: Game, e: Enemy) {
  e.state = BERSERK;
  e.td = 1.1;
  e.tex = 0;
  e.dodgeT = 0;
  play("eliteRoar", { pan: panOf(g, e.sx) });
}

function kill(g: Game, e: Enemy, head: boolean) {
  e.dieT = DIE;
  e.dir = e.tilt > 0 ? 1 : e.tilt < 0 ? -1 : e.dir;
  g.kills++;
  g.score += SCORE[e.kind];
  const cy = e.kind === DRONE ? e.sy : e.sy - HALF[e.kind] * e.sc;
  burst(g, e.sx, cy, 10, BLOOD[e.kind], 0.5);
  burst(g, e.sx, cy, 6, DEBRIS[e.kind], 0.7, 1.8);
  play(DEATH_SFX[e.kind], { volume: 0.7, pan: panOf(g, e.sx) });
  addFeed(g, KILLED[e.kind], INK);
  if (head) {
    g.score += 50;
    addMedal(g, "Headshot", 0, false);
    addFeed(g, "Headshot", VISOR);
    play("headshot", { volume: 0.8 });
    if (e.kind === GRUNT) confetti(g, e.sx, e.sy - 52 * e.sc);
  }
  if (e.state === BERSERK) {
    addMedal(g, "Denied", 100);
    addFeed(g, "Denied", VISOR);
  }
  g.multi = g.t - g.lastKill <= 4 ? g.multi + 1 : 1;
  g.lastKill = g.t;
  if (g.multi === 2) addMedal(g, "Double Kill", 100);
  else if (g.multi === 3) addMedal(g, "Triple Kill", 200);
  else if (g.multi === 4) addMedal(g, "Overkill", 300);
  else if (g.multi === 5) addMedal(g, "Killtacular", 300);
  else if (g.multi >= 6) addMedal(g, "Killtrocity", 300);
  g.spree++;
  if (g.spree === 5) addMedal(g, "Killing Spree", 200);
  else if (g.spree === 10) addMedal(g, "Killing Frenzy", 300);
  if (e.kind === ELITE) {
    let panicked = false;
    for (const o of g.enemies) {
      if (o.on && o.kind === GRUNT && o.dieT <= 0 && o.spawnT <= 0 && Math.abs(o.ex - e.ex) < 0.3) {
        o.state = PANIC;
        o.panicT = 1.6;
        o.td = Math.max(0.05, o.d - 0.35);
        o.tex = clamp(o.ex + (o.ex >= 0 ? 0.35 : -0.35), -0.9, 0.9);
        panicked = true;
      }
    }
    if (panicked) play("gruntPanic", { pan: panOf(g, e.sx) });
  }
}

function flinch(e: Enemy, x: number) {
  e.flash = 0.06;
  e.tilt = (x < e.sx ? 1 : -1) * 0.18;
  if (e.kind !== DRONE && e.state !== BERSERK) e.vd -= 0.08;
}

function hitEnemy(g: Game, e: Enemy, head: boolean, block: boolean, x: number, y: number) {
  const pan = panOf(g, e.sx);
  if (block) {
    e.rip = 0.25; e.ripX = g.rx; e.ripY = g.ry;
    burst(g, x, y, 5, "#ffb070", 0.25);
    play("enemyHit", { volume: 0.3, pan, rate: 1.7 });
    return;
  }
  g.hitT = 0.12;
  if (e.kind === ELITE && e.state !== BERSERK && e.dodgeCd <= 0 && e.dodgeT <= 0) {
    if (Math.random() < 0.35) {
      const dir = e.ex > 0.5 ? -1 : e.ex < -0.5 ? 1 : Math.random() < 0.5 ? -1 : 1;
      e.dodgeT = 0.28;
      e.vx = dir * 1.9;
      e.tex = clamp(e.ex + dir * 0.4, -0.9, 0.9);
      e.dodgeCd = 1.6;
    } else e.dodgeCd = 0.4;
  }
  if (e.kind === ELITE && e.shield > 0) {
    e.shield--;
    e.shimmer = 0.2;
    burst(g, x, y, 6, "#c8f4ff", 0.3);
    if (e.shield === 0) {
      e.breakT = 0.35;
      burst(g, x, y, 14, "#8fe9ff", 0.45);
      play("eliteShieldPop", { pan });
    } else play("enemyHit", { volume: 0.22, pan, rate: 1.3 });
    return;
  }
  flinch(e, x);
  burst(g, x, y, 6, BLOOD[e.kind], 0.35);
  e.hp = head ? 0 : e.hp - 1;
  if (e.hp <= 0) kill(g, e, head);
  else {
    play("enemyHit", { volume: 0.35, pan });
    if (e.kind === ELITE && e.state !== BERSERK && e.hp === 1 && Math.random() < 0.4) goBerserk(g, e);
  }
}

function startReload(g: Game) {
  if (g.reload > 0 || g.ammo === MAG) return;
  g.reload = RELOAD;
  g.pending = false;
  play("reload", { volume: 0.7 });
}

function shoot(g: Game) {
  g.ammo--;
  g.cool = 1 / 9;
  g.muzzle = 0.05;
  const spread = g.bloom * 26 * g.k, a = rand(0, TAU), r = Math.sqrt(Math.random()) * spread;
  const x = g.px + Math.cos(a) * r, y = g.py + Math.sin(a) * r;
  g.tx = x;
  g.ty = y;
  g.bloom = Math.min(1, g.bloom + 0.12);
  play("rifle", { volume: 0.45, rate: rand(0.95, 1.05) });
  const e = hitTest(g, x, y);
  if (e) hitEnemy(g, e, g.head, g.block, x, y);
  else burst(g, x, y, 3, "#9fb4c8", 0.25);
  if (g.ammo <= 0) startReload(g);
}

function throwGrenade(g: Game) {
  if (g.nades <= 0) return;
  let n: Nade | null = null;
  for (const c of g.grenades) if (!c.on) { n = c; break; }
  if (!n) return;
  g.nades--;
  n.on = true; n.t = 0; n.x0 = g.W / 2; n.y0 = g.H + 10; n.x1 = g.px; n.y1 = g.py;
  play("grenadeThrow", { volume: 0.7, pan: panOf(g, g.px) * 0.5 });
}

function explode(g: Game, x: number, y: number) {
  play("grenadeBoom", { pan: panOf(g, x) });
  g.shake = Math.max(g.shake, 0.35);
  const dExp = y > g.hy ? Math.pow(Math.min(1, (y - g.hy) / (g.H * 0.92 - g.hy)), 1 / 1.6) : 0.4;
  const R = 130 * (0.12 + dExp * 0.95) * g.ek * 0.9;
  for (const b of g.blasts) {
    if (b.on) continue;
    b.on = true; b.t = 0; b.x = x; b.y = y; b.r = R;
    break;
  }
  burst(g, x, y, 22, "#ffb347", 0.6, 1.3);
  burst(g, x, y, 10, "#3a3430", 0.9, 2.2);
  for (const e of g.enemies) {
    if (!e.on || e.dieT > 0 || e.spawnT > 0.25) continue;
    const cy = e.kind === DRONE ? e.sy : e.sy - HALF[e.kind] * e.sc;
    const reach = R + 20 * e.sc, dist = Math.hypot(e.sx - x, cy - y);
    if (dist > reach) continue;
    if (e.kind !== DRONE && y > g.hy && Math.abs(e.d - dExp) > 0.22) continue;
    g.hitT = 0.12;
    if (e.kind === ELITE) {
      if (e.shield > 0) {
        e.shield = 0;
        e.breakT = 0.35;
        play("eliteShieldPop", { pan: panOf(g, e.sx) });
      }
      flinch(e, x);
      e.vd -= 0.1;
      e.hp -= dist < reach * 0.5 ? 2 : 1;
      if (e.hp <= 0) kill(g, e, false);
      else if (e.state !== BERSERK && Math.random() < 0.4) goBerserk(g, e);
    } else kill(g, e, false);
  }
}

function muzzleOf(g: Game, e: Enemy) {
  const k = e.kind, s = e.sc;
  if (k === GRUNT) { g.qx = e.sx + 18 * s; g.qy = e.sy + (e.bob - 24) * s; }
  else if (k === ELITE) { g.qx = e.sx + 30 * s; g.qy = e.sy + (e.bob - 61) * s; }
  else if (k === JACKAL) { g.qx = e.sx + e.side * 24 * s; g.qy = e.sy + (e.bob - 51) * s; }
  else { g.qx = e.sx; g.qy = e.sy + 8 * s; }
}

function fireBolt(g: Game, e: Enemy) {
  let b: Bolt | null = null;
  for (const c of g.bolts) if (!c.on) { b = c; break; }
  if (!b) return;
  const n = g.wave, kd = e.kind;
  muzzleOf(g, e);
  b.on = true; b.kind = kd; b.t = 0; b.x0 = g.qx; b.y0 = g.qy;
  const miss = Math.max(0.12, 0.3 - 0.025 * (n - 1)) * (kd === JACKAL ? 0.6 : 1) * (e.state === DIVE ? 0.5 : 1);
  b.hit = Math.random() >= miss;
  if (b.hit) {
    b.x1 = g.W / 2 + rand(-0.08, 0.08) * g.W;
    b.y1 = g.H * rand(0.45, 0.62);
  } else {
    const sp = kd === JACKAL ? 0.6 : 1;
    b.x1 = g.W / 2 + (Math.random() < 0.5 ? -1 : 1) * g.W * rand(0.55, 0.8) * sp;
    b.y1 = g.H * rand(0.1, 1.1);
  }
  b.cx = (b.x0 + b.x1) / 2;
  b.cy = (b.y0 + b.y1) / 2;
  if (kd === JACKAL) {
    b.cx += rand(-1, 1) * g.W * 0.14;
    b.cy -= g.H * 0.08;
  }
  b.dur = BOLT_T[kd] * Math.max(0.6, 1 - 0.05 * (n - 1));
  b.dmg = kd === GRUNT ? 7 + n : kd === ELITE ? 11 + n : kd === JACKAL ? 7 + n : 4 + n * 0.5;
  play(FIRE_SFX[kd], { volume: kd === DRONE ? 0.3 : 0.45, pan: panOf(g, e.sx), rate: kd === DRONE ? 1.4 : rand(0.94, 1.06) });
}

function hurt(g: Game, amt: number) {
  g.sinceHit = 0;
  g.recharging = false;
  g.spree = 0;
  g.shake = Math.max(g.shake, 0.25);
  if (g.shield > 0) {
    const a = Math.min(g.shield, amt);
    g.shield -= a;
    amt -= a;
    g.shieldFlash = 1;
    if (g.shield <= 0.5) { g.shield = 0; play("shieldBreak"); }
    else play("shieldHit", { volume: 0.6 });
  }
  if (amt > 0) {
    g.health = Math.max(0, g.health - amt);
    g.healthFlash = 1;
    play("healthHit");
  }
}

/** Critically damped steering plus tactical behaviour for one live enemy. */
function steer(g: Game, e: Enemy, dt: number, sm: number, fm: number) {
  const kd = e.kind;
  e.tacT -= dt;
  if (e.state === PANIC) {
    e.panicT -= dt;
    if (e.panicT <= 0) { e.state = FIGHT; e.tacT = 0; }
  } else if (e.state === FIGHT && e.tacT <= 0) retarget(g, e);
  if (kd === DRONE) {
    e.diveT -= dt;
    if (e.state === FIGHT && e.diveT <= 0) { e.state = DIVE; e.td = 0.86; e.talt = 0.02; }
    else if (e.state === DIVE && e.d > 0.78) {
      fireBolt(g, e);
      e.state = FIGHT;
      e.td = rand(0.25, 0.5);
      e.talt = rand(0.14, 0.26);
      e.diveT = rand(3, 5.5) * fm;
      e.tacT = rand(0.8, 1.6);
    }
  }
  // lateral: spring toward target, strafing once in position
  const near = Math.abs(e.td - e.d) < 0.06;
  const ampT = e.state === FIGHT && (near || kd === DRONE) ? STRAFE[kd] : 0.02;
  e.amp += (ampT - e.amp) * Math.min(1, dt * 1.5);
  const want = clamp(e.tex + Math.sin(g.t * e.freq + e.ph) * e.amp, -0.95, 0.95);
  if (e.dodgeT > 0) e.dodgeT -= dt;
  else {
    const w = W_LAT[kd], a = (want - e.ex) * w * w - 2 * w * e.vx;
    e.vx += a * dt;
    const mx = (e.state === BERSERK ? 0.6 : e.state === PANIC ? 0.6 : LAT_MAX[kd]) * sm;
    e.vx = clamp(e.vx, -mx, mx);
  }
  e.ex += e.vx * dt;
  if (e.ex < -0.95 || e.ex > 0.95) { e.ex = clamp(e.ex, -0.95, 0.95); e.vx = 0; }
  // depth: accel-clamped approach
  const spd = e.state === BERSERK ? 0.55 : e.state === PANIC ? 0.3 : e.state === DIVE ? 0.55 : SPD[kd] * sm;
  const wantV = clamp((e.td - e.d) * 2.2, -spd, spd), acc = spd * (e.state === BERSERK ? 5 : 3);
  e.vd += clamp(wantV - e.vd, -acc * dt, acc * dt);
  e.d = clamp(e.d + e.vd * dt, 0.01, 1.2);
  e.lean += ((e.vd > 0.03 ? 1 : 0) - e.lean) * Math.min(1, dt * 5);
  if (kd === DRONE) {
    const ta = e.talt + Math.sin(g.t * 2.3 + e.ph) * 0.04;
    e.alt += (ta - e.alt) * Math.min(1, dt * (e.state === DIVE ? 4 : 2));
  }
  // firing
  if (e.state === FIGHT && e.d > 0.22) {
    e.fireT -= dt;
    if (e.fireT <= 0) {
      fireBolt(g, e);
      if (e.burst > 0) { e.burst--; e.fireT = 0.2; }
      else {
        e.burst = kd === ELITE ? (g.wave >= 4 ? 2 : 1) : kd === JACKAL && g.wave >= 5 ? 1 : 0;
        e.fireT = rand(FIRE_CD[kd], FIRE_CD[kd] + 1.3) * fm;
      }
    }
  }
  // gait: phase driven by distance travelled, not time
  const osx = e.sx, osy = e.sy;
  project(g, e);
  if (kd === DRONE) {
    e.stride += dt * 38;
    e.move = 1;
    e.bob = 0;
  } else if (dt > 0) {
    const dist = Math.hypot(e.sx - osx, (e.sy - osy) * 1.5) / e.sc;
    e.stride += (dist / STRIDE[kd]) * Math.PI * 0.5;
    e.move += (clamp(dist / dt / 60, 0, 1) - e.move) * Math.min(1, dt * 8);
    e.bob = -Math.abs(Math.sin(e.stride)) * BOB[kd] * e.move;
  }
}

function update(g: Game, dt: number) {
  g.t += dt;
  g.muzzle = Math.max(0, g.muzzle - dt);
  g.shieldFlash = Math.max(0, g.shieldFlash - dt * 2.5);
  g.healthFlash = Math.max(0, g.healthFlash - dt * 2);
  g.shake = Math.max(0, g.shake - dt);
  g.hitT -= dt;
  g.bannerT -= dt;
  for (const m of g.medals) m.t += dt;
  while (g.medals.length && g.medals[g.medals.length - 1].t > 1.5) g.medals.pop();
  for (const f of g.feed) f.t += dt;
  while (g.feed.length && g.feed[g.feed.length - 1].t > 2.5) g.feed.pop();

  g.sinceHit += dt;
  if (g.sinceHit > 3 && g.shield < 100) {
    if (!g.recharging) { g.recharging = true; play("shieldRecharge"); }
    g.shield = Math.min(100, g.shield + 40 * dt);
  }

  g.cool -= dt;
  if (g.reload > 0) {
    g.reload -= dt;
    if (g.reload <= 0) { g.reload = 0; g.ammo = MAG; }
  } else if ((g.firing || g.pending) && g.cool <= 0) {
    if (g.ammo > 0) { shoot(g); g.pending = false; } else startReload(g);
  }
  if (!g.firing) g.bloom = Math.max(0, g.bloom - dt * 4);

  const n = g.wave;
  const sm = 1 + 0.07 * (n - 1), fm = Math.max(0.5, 1 - 0.07 * (n - 1));
  let alive = 0, onCount = 0;
  for (const e of g.enemies) {
    if (!e.on) continue;
    onCount++;
    e.flash -= dt; e.shimmer -= dt; e.breakT -= dt; e.rip -= dt; e.dodgeCd -= dt;
    e.tilt *= Math.max(0, 1 - dt * 9);
    if (e.dieT > 0) {
      e.dieT -= dt;
      if (e.dieT <= 0) e.on = false;
      continue;
    }
    alive++;
    if (e.spawnT > 0) { e.spawnT -= dt; project(g, e); continue; }
    steer(g, e, dt, sm, fm);
    if (e.state === BERSERK && e.d >= 1) {
      e.on = false;
      hurt(g, 45);
      g.shake = 0.5;
      burst(g, g.W / 2, g.H * 0.7, 18, "#b58cff", 0.5, 1.5);
    }
  }
  // separation: keep enemies at similar depth from overlapping
  const es = g.enemies;
  for (let i = 0; i < es.length; i++) {
    const a = es[i];
    if (!a.on || a.dieT > 0 || a.spawnT > 0 || a.kind === DRONE) continue;
    for (let j = i + 1; j < es.length; j++) {
      const b = es[j];
      if (!b.on || b.dieT > 0 || b.spawnT > 0 || b.kind === DRONE) continue;
      const dd = Math.abs(a.d - b.d);
      if (dd > 0.09) continue;
      const dx = a.ex - b.ex, adx = Math.abs(dx);
      if (adx >= 0.16) continue;
      const push = (0.16 - adx) * (1 - dd / 0.09) * Math.min(1, dt * 6) * 0.5, s = dx > 0 || (dx === 0 && i % 2) ? 1 : -1;
      a.ex += s * push; a.tex += s * push;
      b.ex -= s * push; b.tex -= s * push;
    }
  }
  es.sort(byDepth);

  if (g.waveState === 1) {
    if (g.qi < g.queue.length) {
      g.spawnT -= dt;
      if (g.spawnT <= 0 && alive < Math.min(14, 4 + n)) {
        spawnEnemy(g, g.queue[g.qi++]);
        g.spawnT = Math.max(0.45, 1.5 - n * 0.1) + rand(0, 0.7);
      }
    } else if (onCount === 0) {
      g.waveState = 2;
      g.bannerT = 2;
      g.banner = `WAVE ${n} COMPLETE`;
      g.sub = g.health < 100 ? "+15 health" : "Hold the line";
      g.health = Math.min(100, g.health + 15);
      play("waveComplete");
    }
  } else if (g.waveState === 2 && g.bannerT <= 0) startWave(g, n + 1);
  g.remaining = g.queue.length - g.qi + alive;

  for (const b of g.bolts) {
    if (!b.on) continue;
    b.t += dt / b.dur;
    if (b.t >= 1) {
      b.on = false;
      if (b.hit) hurt(g, b.dmg);
    }
  }
  for (const gr of g.grenades) {
    if (!gr.on) continue;
    gr.t += dt / NADE_T;
    if (gr.t >= 1) { gr.on = false; explode(g, gr.x1, gr.y1); }
  }
  for (const b of g.blasts) {
    if (!b.on) continue;
    b.t += dt / BLAST_T;
    if (b.t >= 1) b.on = false;
  }
  for (const p of g.parts) {
    if (!p.on) continue;
    p.life -= dt;
    if (p.life <= 0) { p.on = false; continue; }
    p.vy += (p.confetti ? 520 : 700) * g.k * dt;
    if (p.confetti) { p.vx *= 1 - 1.5 * dt; p.rot += p.vr * dt; }
    p.x += p.vx * dt;
    p.y += p.vy * dt;
  }
  g.hover = hitTest(g, g.px, g.py) !== null;
  const alarm = g.shield <= 0.5 && g.health > 0;
  if (alarm !== g.alarm) { g.alarm = alarm; setAlarm(alarm); }
}

/* ---------- drawing ---------- */

function drawGrunt(x: Ctx, e: Enemy) {
  const fl = e.flash > 0, panic = e.state === PANIC, s = Math.sin(e.stride), mv = e.move, bob = e.bob;
  const body = fl ? "#ffffff" : "#4a5a78";
  x.fillStyle = "rgba(0,0,0,0.45)";
  x.beginPath(); x.ellipse(0, 0, 18, 4, 0, 0, TAU); x.fill();
  x.fillStyle = fl ? "#ffffff" : "#334058";
  const l = Math.max(0, s) * 6 * mv, r = Math.max(0, -s) * 6 * mv;
  x.fillRect(-11, -12 + bob, 8, 12 - bob - l);
  x.fillRect(3, -12 + bob, 8, 12 - bob - r);
  x.translate(0, bob);
  x.rotate(s * 0.08 * mv);
  const tb = Math.sin(e.stride * 2 + 1) * 1.6 * mv, a = s * 4 * mv;
  const tank = () => {
    x.fillStyle = fl ? "#ffffff" : "#3fc7b0";
    x.beginPath(); x.roundRect(-13, -61 + tb, 26, 24, 6); x.fill();
    x.fillStyle = "#2a8f80"; x.fillRect(-13, -52 + tb, 26, 3);
  };
  if (!panic) tank();
  x.fillStyle = body;
  if (panic) {
    const f = Math.sin(e.stride * 2) * 3;
    x.fillRect(-22, -66 + f, 6, 24); x.fillRect(16, -66 - f, 6, 24);
  } else { x.fillRect(-22, -38 + a, 6, 18); x.fillRect(16, -38 - a, 6, 18); }
  x.beginPath(); x.moveTo(-17, -44); x.lineTo(17, -44); x.lineTo(14, -10); x.lineTo(-14, -10); x.closePath(); x.fill();
  x.beginPath(); x.ellipse(0, -49, 10, 8, 0, 0, TAU); x.fill();
  if (panic) { tank(); return; }
  x.fillStyle = fl ? "#ffffff" : "#d98a2b";
  x.beginPath(); x.moveTo(-13, -43); x.lineTo(13, -43); x.lineTo(9, -20); x.lineTo(0, -15); x.lineTo(-9, -20); x.closePath(); x.fill();
  x.fillStyle = "#a8621a"; x.fillRect(-9, -33, 18, 2);
  x.fillStyle = fl ? "#ffffff" : "#2f9e8d";
  x.beginPath(); x.ellipse(0, -44, 7, 4, 0, 0, TAU); x.fill();
  x.fillStyle = "#ffe07a"; x.fillRect(-6, -53, 3, 2.4); x.fillRect(3, -53, 3, 2.4);
  x.fillStyle = "#1c2a2a"; x.fillRect(13, -27 - a, 9, 6);
  x.fillStyle = "#7dff6a"; x.fillRect(20, -26 - a, 2, 3);
}

function drawElite(x: Ctx, e: Enemy) {
  const fl = e.flash > 0, s = Math.sin(e.stride), mv = e.move, bob = e.bob, bers = e.state === BERSERK;
  const armor = fl ? "#ffffff" : bers ? "#4f6cf0" : "#3552c8", dark = fl ? "#ffffff" : "#1a2140";
  x.fillStyle = "rgba(0,0,0,0.45)";
  x.beginPath(); x.ellipse(0, 0, 22, 5, 0, 0, TAU); x.fill();
  for (let sd = -1; sd <= 1; sd += 2) {
    const lx = sd * 9, lift = Math.max(0, sd * s) * 7 * mv, kn = sd * s * 3 * mv;
    x.fillStyle = dark;
    x.beginPath(); x.moveTo(lx - 5, -60 + bob); x.lineTo(lx + 5, -60 + bob); x.lineTo(lx + 7 + kn, -32 + bob * 0.5);
    x.lineTo(lx + 3, -15 - lift); x.lineTo(lx + 6, -lift); x.lineTo(lx - 6, -lift); x.lineTo(lx - 4, -16 - lift);
    x.lineTo(lx - 7 + kn, -33 + bob * 0.5); x.closePath(); x.fill();
    x.fillStyle = armor; x.fillRect(lx - 6, -60 + bob, 12, 17);
  }
  x.translate(0, bob + e.lean * 4);
  const a = s * 4 * mv;
  x.fillStyle = dark; x.fillRect(-11, -68, 22, 12);
  if (bers) {
    x.fillRect(-34, -134, 7, 42); x.fillRect(27, -134, 7, 42);
    x.beginPath(); x.ellipse(-30.5, -136, 6, 5, 0, 0, TAU); x.ellipse(30.5, -136, 6, 5, 0, 0, TAU); x.fill();
  } else { x.fillRect(-32, -90 + a, 7, 30); x.fillRect(25, -90 - a, 7, 26); }
  x.fillStyle = armor;
  x.beginPath(); x.moveTo(-24, -98); x.lineTo(24, -98); x.lineTo(18, -74); x.lineTo(8, -64); x.lineTo(-8, -64); x.lineTo(-18, -74); x.closePath(); x.fill();
  x.beginPath(); x.ellipse(-25, -93, 9, 7, 0, 0, TAU); x.ellipse(25, -93, 9, 7, 0, 0, TAU); x.fill();
  x.fillStyle = "rgba(170,195,255,0.35)";
  x.beginPath(); x.moveTo(-14, -96); x.lineTo(-4, -96); x.lineTo(-6, -76); x.lineTo(-12, -80); x.closePath(); x.fill();
  if (!bers) {
    x.fillStyle = "#2b2f55";
    x.beginPath(); x.ellipse(24, -62 - a, 10, 5, 0.35, 0, TAU); x.fill();
    x.fillStyle = "#8f7bff"; x.fillRect(29, -61 - a, 3, 3);
  }
  x.translate(0, e.lean * 3);
  x.fillStyle = dark; x.fillRect(-4, -104, 8, 8);
  x.fillStyle = armor;
  x.beginPath(); x.moveTo(-8, -105); x.lineTo(0, -116); x.lineTo(8, -105); x.lineTo(6, -99); x.lineTo(-6, -99); x.closePath(); x.fill();
  const sp = bers ? 3 : 0;
  x.strokeStyle = fl ? "#ffffff" : "#4a3f5c"; x.lineWidth = 2;
  x.beginPath();
  x.moveTo(-5, -100); x.lineTo(-8 - sp, -91); x.moveTo(-2, -99); x.lineTo(-3 - sp * 0.5, -90);
  x.moveTo(2, -99); x.lineTo(3 + sp * 0.5, -90); x.moveTo(5, -100); x.lineTo(8 + sp, -91);
  x.stroke();
  x.fillStyle = bers ? "#ff6a3d" : "#ffd36b"; x.fillRect(-5, -106, 3, 2); x.fillRect(2, -106, 3, 2);
  if (e.shimmer > 0) {
    x.globalAlpha *= e.shimmer / 0.2;
    x.beginPath(); x.ellipse(0, -58, 32, 64, 0, 0, TAU);
    x.fillStyle = "rgba(143,233,255,0.18)"; x.fill();
    x.strokeStyle = "#d8fbff"; x.lineWidth = 3; x.stroke();
  }
  if (e.breakT > 0) {
    const p = 1 - e.breakT / 0.35;
    x.globalAlpha = 1 - p;
    x.beginPath(); x.ellipse(0, -58, 32 + p * 34, 64 + p * 34, 0, 0, TAU);
    x.fillStyle = "rgba(230,250,255,0.35)"; x.fill();
    x.strokeStyle = "#ffffff"; x.lineWidth = 4; x.stroke();
  }
}

/** Drawn in shield-side-mirrored space: shield on local -x, exposed side on +x. */
function drawJackal(x: Ctx, e: Enemy, disc: HTMLCanvasElement) {
  const fl = e.flash > 0, s = Math.sin(e.stride), mv = e.move, hop = e.bob;
  const skin = fl ? "#ffffff" : "#9c7b52", armor = fl ? "#ffffff" : "#5b3f86";
  x.fillStyle = "rgba(0,0,0,0.45)";
  x.beginPath(); x.ellipse(0, 0, 16, 4, 0, 0, TAU); x.fill();
  x.strokeStyle = skin; x.lineWidth = 4.5; x.lineCap = "round"; x.lineJoin = "round";
  x.beginPath();
  for (let sd = -1; sd <= 1; sd += 2) {
    const lift = Math.max(0, sd * s) * 7 * mv, fx = sd * 6 + sd * s * 3 * mv;
    x.moveTo(sd * 5, -44 + hop);
    x.lineTo(sd * 8 + 6, -27 + hop * 0.6 - lift * 0.4);
    x.lineTo(fx - 2, -10 - lift);
    x.lineTo(fx + 5, -lift);
  }
  x.stroke();
  x.translate(0, hop);
  x.rotate(s * 0.04 * mv);
  x.fillStyle = armor;
  x.beginPath(); x.moveTo(-9, -70); x.lineTo(10, -73); x.lineTo(13, -46); x.lineTo(-7, -42); x.closePath(); x.fill();
  x.fillStyle = fl ? "#ffffff" : "#3e2b5e"; x.fillRect(-8, -52, 20, 5);
  x.fillStyle = skin;
  x.fillRect(3, -80, 5, 9);
  x.beginPath(); x.ellipse(7, -84, 9, 6.5, -0.15, 0, TAU); x.fill();
  x.beginPath(); x.moveTo(13, -87); x.lineTo(24, -82); x.lineTo(13, -79); x.closePath(); x.fill();
  x.strokeStyle = fl ? "#ffffff" : "#e0782c"; x.lineWidth = 2;
  x.beginPath(); x.moveTo(0, -88); x.lineTo(-9, -97); x.moveTo(-1, -85); x.lineTo(-11, -89); x.moveTo(0, -82); x.lineTo(-9, -80); x.stroke();
  x.fillStyle = "#ffe14a"; x.fillRect(9, -87, 2.5, 2);
  // exposed arm + needler
  const a = s * 2 * mv;
  x.strokeStyle = skin; x.lineWidth = 3.5;
  x.beginPath(); x.moveTo(9, -66); x.lineTo(15, -58 + a); x.lineTo(20, -52 + a); x.stroke();
  x.fillStyle = fl ? "#ffffff" : "#4d2a5c";
  x.beginPath(); x.ellipse(21, -51 + a, 6, 3.2, 0, 0, TAU); x.fill();
  x.fillStyle = "#ff5fc8"; x.fillRect(24, -53 + a, 3, 2); x.fillRect(22, -55 + a, 2, 2);
  // shield arm + energy shield
  x.strokeStyle = skin;
  x.beginPath(); x.moveTo(-7, -66); x.lineTo(-13, -56); x.stroke();
  x.drawImage(disc, -44, -82, 48, 60);
  x.strokeStyle = "rgba(255,170,90,0.85)"; x.lineWidth = 1.5;
  x.beginPath(); x.ellipse(-20, -52, 24, 30, 0, 0, TAU); x.stroke();
  if (e.rip > 0) {
    const p = 1 - e.rip / 0.25, ga = x.globalAlpha;
    x.globalAlpha = ga * (1 - p);
    x.strokeStyle = "#fff0d8"; x.lineWidth = 2;
    x.beginPath(); x.ellipse(e.ripX, e.ripY, 3 + p * 14, 3 + p * 17, 0, 0, TAU); x.stroke();
    x.beginPath(); x.ellipse(e.ripX, e.ripY, p * 7, p * 8, 0, 0, TAU); x.stroke();
    x.globalAlpha = ga;
  }
}

function drawDrone(x: Ctx, e: Enemy) {
  const fl = e.flash > 0, f = Math.sin(e.stride);
  for (let sd = -1; sd <= 1; sd += 2) {
    x.save();
    x.rotate(sd * (0.2 + f * 0.5));
    x.fillStyle = "rgba(200,235,170,0.35)"; x.strokeStyle = "rgba(225,255,205,0.6)"; x.lineWidth = 1;
    x.beginPath(); x.ellipse(sd * 16, -5, 16, 4 + Math.abs(f) * 2, 0, 0, TAU); x.fill(); x.stroke();
    x.beginPath(); x.ellipse(sd * 11, 1, 10, 3, 0, 0, TAU); x.fill();
    x.restore();
  }
  x.strokeStyle = fl ? "#ffffff" : "#2e3820"; x.lineWidth = 1.5;
  x.beginPath();
  x.moveTo(-3, 6); x.lineTo(-7, 15); x.moveTo(3, 6); x.lineTo(7, 15); x.moveTo(0, 8); x.lineTo(0, 17);
  x.stroke();
  x.fillStyle = fl ? "#ffffff" : "#5e6b3a";
  x.beginPath(); x.ellipse(0, 0, 7, 10, 0, 0, TAU); x.fill();
  x.fillStyle = fl ? "#ffffff" : "#3d4a28";
  x.beginPath(); x.ellipse(0, 10, 5, 7, 0, 0, TAU); x.fill();
  x.fillStyle = fl ? "#ffffff" : "#76844a";
  x.beginPath(); x.ellipse(0, -10, 6, 5, 0, 0, TAU); x.fill();
  x.fillStyle = "#ff9a3d"; x.fillRect(-4.5, -12, 3, 2.5); x.fillRect(1.5, -12, 3, 2.5);
}

function drawEnemy(c: Ctx, g: Game, e: Enemy, x: number, alpha: number) {
  c.save();
  c.translate(x, e.sy);
  c.globalAlpha = alpha;
  if (e.dieT > 0) {
    const p = 1 - e.dieT / DIE;
    if (e.kind === DRONE) {
      c.translate(0, p * p * 120 * e.sc);
      c.rotate(p * 5 * e.dir);
    } else {
      c.translate(0, p * 4 * e.sc);
      c.rotate(p * 1.35 * e.dir);
    }
    c.globalAlpha = alpha * (1 - p * p);
  } else if (e.tilt) c.rotate(e.tilt);
  c.scale(e.sc, e.sc);
  if (e.kind === GRUNT) drawGrunt(c, e);
  else if (e.kind === ELITE) drawElite(c, e);
  else if (e.kind === JACKAL) { c.scale(e.side, 1); drawJackal(c, e, g.disc); }
  else drawDrone(c, e);
  c.restore();
}

function chamferPath(c: Ctx, x: number, y: number, w: number, h: number, cut: number) {
  c.beginPath();
  c.moveTo(x + cut, y); c.lineTo(x + w, y); c.lineTo(x + w, y + h - cut);
  c.lineTo(x + w - cut, y + h); c.lineTo(x, y + h); c.lineTo(x, y + cut); c.closePath();
}

function drawHud(g: Game) {
  const { ctx: c, W, H, k, t } = g;
  // shield bar
  const bw = Math.min(W * 0.42, 420 * k), bh = 11 * k, bx = (W - bw) / 2, by = 16 * k, sl = 9 * k;
  const empty = g.shield <= 0.5, blink = Math.sin(t * 14) > 0, rech = g.sinceHit > 3 && g.shield < 100;
  c.beginPath(); c.moveTo(bx, by); c.lineTo(bx + bw, by); c.lineTo(bx + bw - sl, by + bh); c.lineTo(bx + sl, by + bh); c.closePath();
  c.fillStyle = empty && blink ? "rgba(255,75,62,0.25)" : "rgba(3,6,11,0.55)"; c.fill();
  c.strokeStyle = empty ? (blink ? RED : "rgba(255,75,62,0.45)") : "rgba(92,214,255,0.6)"; c.lineWidth = 1.2; c.stroke();
  const segs = 24, x0 = bx + sl, sw = (bw - 2 * sl) / segs, f = (g.shield / 100) * segs;
  c.fillStyle = HOLO;
  for (let i = 0; i < segs; i++) {
    const fill = clamp(f - i, 0, 1);
    if (fill <= 0) break;
    c.globalAlpha = fill * (rech ? 0.55 + 0.45 * Math.sin(t * 18) : 0.95);
    c.fillRect(x0 + i * sw + 1, by + 2.5 * k, sw - 2, bh - 5 * k);
  }
  c.globalAlpha = 1;
  const hw = bw * 0.6, hx = (W - hw) / 2, hy = by + bh + 4 * k, hh = 4 * k, low = g.health < 35;
  c.fillStyle = "rgba(221,231,240,0.12)"; c.fillRect(hx, hy, hw, hh);
  c.fillStyle = low ? (blink ? RED : "#a3322a") : INK;
  const hsw = hw / 10;
  for (let i = 0; i < 10; i++) {
    const fill = clamp((g.health / 100) * 10 - i, 0, 1);
    if (fill <= 0) break;
    c.fillRect(hx + i * hsw + 1, hy, (hsw - 2) * fill, hh);
  }
  // wave + score
  c.textBaseline = "top";
  c.textAlign = "left";
  c.font = g.fXs; c.fillStyle = HOLO; c.fillText("WAVE", 16 * k, 12 * k);
  c.font = g.fLg; c.fillStyle = INK; c.fillText(String(g.wave), 16 * k, 25 * k);
  c.font = g.fXs; c.fillStyle = MUTED; c.fillText(`${g.remaining} hostiles`, 16 * k, 64 * k);
  c.textAlign = "right";
  c.fillStyle = HOLO; c.fillText("SCORE", W - 16 * k, 12 * k);
  c.font = g.fMd; c.fillStyle = INK; c.fillText(g.score.toLocaleString("en-US"), W - 16 * k, 27 * k);
  // ammo
  const right = W - 18 * k, base = H - 14 * k, tw = 3 * k, th = 8 * k, gap = 2 * k, rowW = 16 * (tw + gap) - gap;
  const rowTop = base - 44 * k - 2 * th;
  const shown = g.reload > 0 ? Math.floor(MAG * (1 - g.reload / RELOAD)) : g.ammo;
  for (let pass = 0; pass < 2; pass++) {
    c.fillStyle = pass === 0 ? "rgba(92,214,255,0.16)" : g.reload > 0 ? VISOR : HOLO;
    for (let i = 0; i < MAG; i++) {
      if ((pass === 1) !== i < shown) continue;
      c.fillRect(right - rowW + (i % 16) * (tw + gap), rowTop + (i < 16 ? 0 : th + 3 * k), tw, th);
    }
  }
  // grenade icons, left of the ammo counter
  for (let i = 0; i < 2; i++) {
    const gx = right - rowW - 14 * k - i * 14 * k, gy = rowTop + th + 1.5 * k;
    c.fillStyle = i < g.nades ? HOLO : "rgba(92,214,255,0.16)";
    c.beginPath(); c.ellipse(gx, gy + 2 * k, 4.5 * k, 5.5 * k, 0, 0, TAU); c.fill();
    c.fillRect(gx - 2 * k, gy - 6 * k, 4 * k, 3 * k);
    c.fillRect(gx + 1 * k, gy - 5 * k, 4 * k, 1.5 * k);
  }
  c.textBaseline = "alphabetic";
  c.font = g.fLg; c.fillStyle = g.ammo <= 8 && g.reload <= 0 ? VISOR : INK;
  c.fillText(String(g.reload > 0 ? 0 : g.ammo), right, base);
  if (g.reload > 0 || (g.ammo <= 8 && blink)) {
    c.font = g.fSm; c.fillStyle = VISOR;
    c.fillText(g.reload > 0 ? "RELOADING" : g.touch ? "TAP TO RELOAD" : "R  RELOAD", right, rowTop - 6 * k);
  }
  // kill feed, bottom-left above the buttons (newest at the bottom)
  c.textAlign = "left";
  c.font = g.fSm;
  const fy = H - Math.max(48, 40 * k);
  for (let i = 0; i < g.feed.length; i++) {
    const fe = g.feed[i];
    c.globalAlpha = fe.t > 2 ? Math.max(0, (2.5 - fe.t) / 0.5) : 1;
    c.fillStyle = fe.c;
    c.fillRect(14 * k, fy - i * 19 * k - 9 * k, 3 * k, 10 * k);
    c.fillText(fe.text, 22 * k, fy - i * 19 * k);
  }
  c.globalAlpha = 1;
  // medals
  c.textAlign = "center"; c.textBaseline = "middle"; c.font = g.fMd;
  const my = hy + hh + 22 * k, mh = 28 * k;
  for (let i = 0; i < g.medals.length; i++) {
    const m = g.medals[i], pop = m.t < 0.15 ? 1.35 - (m.t / 0.15) * 0.35 : 1;
    const w = c.measureText(m.text).width + 36 * k;
    c.save();
    c.globalAlpha = m.t > 1.2 ? Math.max(0, (1.5 - m.t) / 0.3) : 1;
    c.translate(W / 2, my + i * (mh + 6 * k));
    c.scale(pop, pop);
    chamferPath(c, -w / 2, -mh / 2, w, mh, 7 * k);
    c.fillStyle = "rgba(3,6,11,0.78)"; c.fill();
    c.strokeStyle = VISOR; c.lineWidth = 1.5; c.stroke();
    c.fillStyle = VISOR;
    c.beginPath(); const dx = -w / 2 + 13 * k;
    c.moveTo(dx, -5 * k); c.lineTo(dx + 5 * k, 0); c.lineTo(dx, 5 * k); c.lineTo(dx - 5 * k, 0); c.closePath(); c.fill();
    c.fillStyle = INK; c.fillText(m.text, 7 * k, 1);
    c.restore();
  }
  // banner
  if (g.bannerT > 0) {
    const cy = H * 0.3;
    c.globalAlpha = Math.min(1, g.bannerT / 0.4);
    c.font = g.fXl; c.fillStyle = INK; c.fillText(g.banner, W / 2, cy);
    c.font = g.fSm; c.fillStyle = HOLO; c.fillText(g.sub.toUpperCase(), W / 2, cy + 30 * k);
    c.fillRect(W / 2 - 120 * k, cy + 44 * k, 240 * k, 1);
    c.globalAlpha = 1;
  }
  // reticle
  const rr = (13 + g.bloom * 9) * k;
  c.strokeStyle = g.hover ? RED : HOLO;
  c.fillStyle = c.strokeStyle;
  c.globalAlpha = g.reload > 0 ? 0.45 : 1;
  c.lineWidth = 2;
  for (let i = 0; i < 4; i++) {
    const a = i * (Math.PI / 2) + Math.PI / 4;
    c.beginPath(); c.arc(g.px, g.py, rr, a - 0.55, a + 0.55); c.stroke();
  }
  c.fillRect(g.px - 1.5, g.py - 1.5, 3, 3);
  if (g.hitT > 0) {
    c.globalAlpha = Math.min(1, g.hitT / 0.06);
    c.strokeStyle = "#ffffff";
    c.beginPath();
    for (let i = 0; i < 4; i++) {
      const a = i * (Math.PI / 2) + Math.PI / 4, cs = Math.cos(a), sn = Math.sin(a), r0 = 5 * k, r1 = 10 * k;
      c.moveTo(g.px + cs * r0, g.py + sn * r0);
      c.lineTo(g.px + cs * r1, g.py + sn * r1);
    }
    c.stroke();
  }
  c.globalAlpha = 1;
}

function render(g: Game) {
  const { ctx: c, W, H, dpr, k } = g;
  let ox = 0, oy = 0;
  if (g.shake > 0 && !g.reduced) {
    const m = g.shake * 24 * k;
    ox = rand(-m, m);
    oy = rand(-m, m);
  }
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  c.globalAlpha = 1;
  c.globalCompositeOperation = "source-over";
  if (ox || oy) { c.fillStyle = "#03060b"; c.fillRect(0, 0, W, H); }
  c.setTransform(dpr, 0, 0, dpr, ox * dpr, oy * dpr);
  c.drawImage(g.bg, 0, 0, W, H);
  if (!g.started) return;

  // enemies are sorted far-to-near in update()
  for (const e of g.enemies) {
    if (!e.on) continue;
    let a = 1;
    if (e.spawnT > 0) {
      a = clamp(((1 - e.spawnT / SPAWN) - 0.35) / 0.5, 0, 1);
      if (a <= 0) continue;
    }
    if (e.dodgeT > 0) {
      const off = e.vx * W * 0.46 * (0.25 + 0.75 * e.d) * 0.035;
      drawEnemy(c, g, e, e.sx - off * 2, 0.15);
      drawEnemy(c, g, e, e.sx - off, 0.3);
    }
    drawEnemy(c, g, e, e.sx, a);
  }
  for (const p of g.parts) {
    if (!p.on) continue;
    c.globalAlpha = p.life / p.max;
    c.fillStyle = p.c;
    if (p.confetti) {
      const w = p.sz * Math.abs(Math.cos(p.rot)) + 0.6;
      c.fillRect(p.x - w / 2, p.y - p.sz * 0.35, w, p.sz * 0.7);
    } else c.fillRect(p.x - p.sz / 2, p.y - p.sz / 2, p.sz, p.sz);
  }
  c.globalAlpha = 1;
  for (const n of g.grenades) {
    if (!n.on) continue;
    const p = n.t, x = n.x0 + (n.x1 - n.x0) * p, y = n.y0 + (n.y1 - n.y0) * p - Math.sin(Math.PI * p) * H * 0.28;
    const r = (7 - 4 * p) * k;
    c.fillStyle = "#1d2a1f";
    c.beginPath(); c.ellipse(x, y, r, r * 0.8, p * 12, 0, TAU); c.fill();
    c.strokeStyle = "rgba(92,214,255,0.5)"; c.lineWidth = 1; c.stroke();
    if (Math.sin(g.t * 40) > 0) { c.fillStyle = RED; c.fillRect(x - 1.5, y - 1.5, 3, 3); }
  }
  c.globalCompositeOperation = "lighter";
  for (const e of g.enemies) {
    if (!e.on || e.dieT > 0) continue;
    if (e.spawnT > 0) {
      const p = 1 - e.spawnT / SPAWN, w = Math.max(6, 40 * e.sc), h = Math.max(50, 230 * e.sc);
      c.globalAlpha = Math.sin(Math.PI * p);
      c.drawImage(g.col, e.sx - w / 2, e.sy - h, w, h);
      continue;
    }
    if (e.state !== FIGHT || e.fireT > 0.35 || e.d <= 0.22) continue;
    const p = 1 - e.fireT / 0.35, r = (5 + p * 9) * e.sc;
    muzzleOf(g, e);
    c.globalAlpha = 0.4 + 0.6 * p;
    c.drawImage(g.glows[e.kind], g.qx - r, g.qy - r, r * 2, r * 2);
  }
  for (const b of g.bolts) {
    if (!b.on) continue;
    const spr = g.glows[b.kind], needle = b.kind === JACKAL, segs = needle ? 3 : 2;
    const size = needle ? 0.6 : b.kind === DRONE ? 0.7 : 1;
    for (let j = segs - 1; j >= 0; j--) {
      const tt = Math.max(0, b.t - j * 0.07), p = tt * tt, q = 1 - p;
      const r = g.ek * (3 + tt * tt * 26) * (j ? 0.6 : 1) * size;
      const x = q * q * b.x0 + 2 * q * p * b.cx + p * p * b.x1, y = q * q * b.y0 + 2 * q * p * b.cy + p * p * b.y1;
      c.globalAlpha = j ? 0.45 / j : 1;
      c.drawImage(spr, x - r, y - r, r * 2, r * 2);
    }
  }
  for (const b of g.blasts) {
    if (!b.on) continue;
    const p = b.t, r = b.r * (0.6 + p);
    c.globalAlpha = (1 - p) * (1 - p);
    c.drawImage(g.glowO, b.x - r, b.y - r, r * 2, r * 2);
    c.globalAlpha = 1 - p;
    c.strokeStyle = "#ffd28c"; c.lineWidth = 3 * k * (1 - p) + 1;
    c.beginPath(); c.ellipse(b.x, b.y, b.r * (0.2 + 1.1 * p), b.r * (0.2 + 1.1 * p) * 0.5, 0, 0, TAU); c.stroke();
  }
  c.globalAlpha = 1;
  // MA5 silhouette
  c.globalCompositeOperation = "source-over";
  const R = W - 140 * k + (g.muzzle > 0 ? 3 * k : 0), B = H + (g.muzzle > 0 ? 3 * k : 0);
  c.beginPath();
  c.moveTo(R, B); c.lineTo(R - 95 * k, B); c.lineTo(R - 140 * k, B - 70 * k); c.lineTo(R - 150 * k, B - 88 * k);
  c.lineTo(R - 132 * k, B - 98 * k); c.lineTo(R - 66 * k, B - 62 * k); c.lineTo(R - 18 * k, B - 52 * k); c.lineTo(R + 4 * k, B - 26 * k);
  c.closePath();
  c.fillStyle = "#0b121c"; c.fill();
  c.strokeStyle = "rgba(92,214,255,0.35)"; c.lineWidth = 1.2; c.stroke();
  c.fillStyle = "rgba(92,214,255,0.5)"; c.fillRect(R - 70 * k, B - 50 * k, 26 * k, 2 * k);
  if (g.muzzle > 0) {
    const mx = R - 142 * k, my = B - 94 * k;
    c.globalCompositeOperation = "lighter";
    c.strokeStyle = "rgba(255,200,120,0.35)"; c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(mx, my); c.lineTo(g.tx, g.ty); c.stroke();
    c.strokeStyle = "rgba(255,170,60,0.9)"; c.lineWidth = 5 * k;
    c.beginPath(); c.moveTo(mx, my); c.lineTo(mx + (g.tx - mx) * 0.22, my + (g.ty - my) * 0.22); c.stroke();
    const r = 26 * k;
    c.drawImage(g.glowO, mx - r, my - r, r * 2, r * 2);
    c.globalCompositeOperation = "source-over";
  }
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (g.shieldFlash > 0) { c.globalAlpha = g.shieldFlash * 0.75; c.drawImage(g.vigB, 0, 0, W, H); }
  const lowPulse = g.shield <= 0.5 && g.health < 40 ? 0.3 + 0.15 * Math.sin(g.t * 6) : 0;
  const red = Math.max(g.healthFlash * 0.9, lowPulse);
  if (red > 0) { c.globalAlpha = red; c.drawImage(g.vigR, 0, 0, W, H); }
  c.globalAlpha = 1;
  drawHud(g);
}

/* ---------- component ---------- */

const btn = "chamfer bg-holo px-6 py-3 font-hud text-lg font-semibold tracking-wide text-void [--cut:10px]";
const smallBtn =
  "border border-line bg-void/60 px-3 py-1 font-hud text-xs uppercase tracking-[0.2em] text-muted hover:text-ink";

function silence(g: Game | null) {
  if (g) g.alarm = false;
  setAlarm(false);
}

export default function FirefightGame() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Game | null>(null);
  const phaseRef = useRef<Phase>("ready");
  const [phase, setPhase] = useState<Phase>("ready");
  const [muted, setMutedUi] = useState(() => typeof window !== "undefined" && isMuted());
  const [summary, setSummary] = useState(() => ({ wave: 0, score: 0, medals: 0, best: readBest(), fresh: false }));

  useEffect(() => {
    const canvas = canvasRef.current, wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const g = createGame(canvas, ctx);
    gameRef.current = g;
    const pauseNow = () => {
      if (phaseRef.current !== "playing") return;
      g.firing = false;
      g.pending = false;
      silence(g);
      suspendAudio();
      phaseRef.current = "paused";
      setPhase("paused");
    };
    const resize = () => {
      sizeGame(g, canvas.clientWidth, canvas.clientHeight);
      if (phaseRef.current !== "playing") render(g);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    resize();
    let alive = true;
    document.fonts?.ready.then(() => {
      if (alive && phaseRef.current !== "playing") render(g);
    });
    const io = new IntersectionObserver(
      (entries) => {
        for (const en of entries) if (en.intersectionRatio < 0.3) pauseNow();
      },
      { threshold: [0, 0.3] },
    );
    io.observe(wrap);
    const onVis = () => { if (document.hidden) pauseNow(); };
    const setPos = (e: PointerEvent) => {
      g.px = e.offsetX;
      g.py = e.offsetY;
      g.hasPointer = true;
      g.touch = e.pointerType === "touch";
    };
    const onDown = (e: PointerEvent) => {
      if (phaseRef.current !== "playing") return;
      e.preventDefault();
      setPos(e);
      if (e.button === 2) { throwGrenade(g); return; }
      if (e.button !== 0) return;
      try { canvas.setPointerCapture(e.pointerId); } catch { /* ignore */ }
      if (g.px >= g.W - 130 * g.k && g.py >= g.H - 95 * g.k) { startReload(g); return; }
      if (g.reload > 0) play("dryfire", { volume: 0.5 });
      g.firing = true;
      g.pending = true;
    };
    const onMove = (e: PointerEvent) => setPos(e);
    const onUp = () => { g.firing = false; };
    const onMenu = (e: Event) => e.preventDefault();
    const onKey = (e: KeyboardEvent) => {
      const tg = e.target as HTMLElement | null;
      if (tg && (tg.tagName === "INPUT" || tg.tagName === "TEXTAREA" || tg.isContentEditable)) return;
      if (e.key === "m" || e.key === "M") {
        initAudio();
        const next = !isMuted();
        setMuted(next);
        setMutedUi(next);
        return;
      }
      if (phaseRef.current !== "playing") return;
      if (e.key === "r" || e.key === "R") startReload(g);
      else if (e.key === "g" || e.key === "G") throwGrenade(g);
      else if (e.key === "Escape") pauseNow();
    };
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);
    canvas.addEventListener("pointerleave", onUp);
    canvas.addEventListener("contextmenu", onMenu);
    window.addEventListener("keydown", onKey);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      alive = false;
      ro.disconnect();
      io.disconnect();
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
      canvas.removeEventListener("pointerleave", onUp);
      canvas.removeEventListener("contextmenu", onMenu);
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("visibilitychange", onVis);
      silence(g);
      suspendAudio();
      gameRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (phase !== "playing") return;
    const g = gameRef.current;
    if (!g) return;
    let raf = 0, last = -1;
    const frame = (now: number) => {
      const dt = last < 0 ? 0 : Math.min(0.05, (now - last) / 1000);
      last = now;
      update(g, dt);
      render(g);
      if (g.health <= 0) {
        silence(g);
        play("gameOver");
        const prev = readBest(), best = Math.max(prev, g.score);
        if (best > prev) writeBest(best);
        phaseRef.current = "over";
        setPhase("over");
        setSummary({ wave: g.wave, score: g.score, medals: g.medalCount, best, fresh: g.score > prev && g.score > 0 });
        return;
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  const start = () => {
    const g = gameRef.current;
    if (!g) return;
    initAudio();
    resumeAudio();
    resetGame(g);
    phaseRef.current = "playing";
    setPhase("playing");
  };
  const resume = () => {
    initAudio();
    resumeAudio();
    play("ui");
    phaseRef.current = "playing";
    setPhase("playing");
  };
  const pause = () => {
    const g = gameRef.current;
    if (g) g.firing = false;
    play("ui");
    silence(g);
    suspendAudio();
    phaseRef.current = "paused";
    setPhase("paused");
  };
  const toggleSound = () => {
    initAudio();
    const next = !isMuted();
    setMuted(next);
    setMutedUi(next);
    if (!next) play("ui");
  };
  const grenade = () => {
    const g = gameRef.current;
    if (g && phaseRef.current === "playing") throwGrenade(g);
  };

  const playing = phase === "playing";
  return (
    <div
      ref={wrapRef}
      className="panel chamfer relative aspect-[4/3] max-h-[70vh] min-h-[320px] w-full select-none overflow-hidden [--cut:14px] sm:aspect-video"
    >
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="Firefight mini game"
        className={`absolute inset-px block h-[calc(100%-2px)] w-[calc(100%-2px)] ${playing ? "cursor-none touch-none" : "cursor-default touch-auto"}`}
      />
      {playing && (
        <div className="absolute bottom-3 left-3 flex gap-2">
          <button type="button" onClick={pause} className={smallBtn}>
            Pause
          </button>
          <button type="button" onClick={toggleSound} aria-pressed={!muted} className={smallBtn}>
            {muted ? "Sound off" : "Sound on"}
          </button>
          <button type="button" onClick={grenade} className={smallBtn}>
            Grenade
          </button>
        </div>
      )}
      {!playing && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-void/70 px-6 text-center backdrop-blur-sm">
          {phase === "ready" && (
            <>
              <p className="font-hud text-xs uppercase tracking-[0.35em] text-holo">Horde mode // Installation 04</p>
              <h3 className="font-display text-4xl uppercase text-ink">Firefight</h3>
              <p className="max-w-md text-muted">
                Hold to fire, R to reload, right-click or G for grenades, M to mute. Survive as many waves as you can.
              </p>
              {summary.best > 0 && (
                <p className="font-hud text-sm uppercase tracking-widest text-visor">Best {summary.best.toLocaleString("en-US")}</p>
              )}
              <button type="button" onClick={start} className={`mt-2 ${btn}`}>Start firefight</button>
            </>
          )}
          {phase === "paused" && (
            <>
              <h3 className="font-display text-4xl uppercase text-ink">Paused</h3>
              <button type="button" onClick={resume} className={`mt-2 ${btn}`}>Resume</button>
            </>
          )}
          {phase === "over" && (
            <>
              <h3 className="font-display text-4xl uppercase text-ink">Game over</h3>
              <p className="font-hud text-xl tracking-wide text-ink">
                Wave {summary.wave}, score {summary.score.toLocaleString("en-US")}
              </p>
              <p className="font-hud text-sm uppercase tracking-widest text-visor">
                {summary.fresh ? "New best! " : "Best "}
                {summary.best.toLocaleString("en-US")}
              </p>
              <p className="text-muted">
                {summary.medals} {summary.medals === 1 ? "medal" : "medals"} earned
              </p>
              <button type="button" onClick={start} className={`mt-2 ${btn}`}>Play again</button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
