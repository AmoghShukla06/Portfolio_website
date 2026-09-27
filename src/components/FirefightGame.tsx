"use client";

import { useEffect, useRef, useState } from "react";

type Phase = "ready" | "playing" | "paused" | "over";

const BEST_KEY = "firefight-best";
const MAG = 32;
const RELOAD = 1.4;
const DIE = 0.5;
const MAX_ENEMIES = 16;
const MAX_BOLTS = 40;
const MAX_PARTS = 160;
const TAU = Math.PI * 2;
const HOLO = "#5cd6ff";
const VISOR = "#f2a93b";
const RED = "#ff4b3e";
const INK = "#dde7f0";
const MUTED = "#7d8fa3";
const CONFETTI = ["#ff4fa3", "#ffd23f", "#4fe3ff", "#7dff6a", "#b57bff", "#ff8a3d"];

interface Enemy {
  on: boolean; elite: boolean; d: number; targetD: number; speed: number;
  ex: number; exBase: number; ph: number; freq: number; amp: number;
  hp: number; shield: number; state: number; panicT: number; fireT: number;
  flash: number; shimmer: number; breakT: number; dieT: number; dir: number; walk: number;
  sx: number; sy: number; sc: number;
}
interface Bolt { on: boolean; elite: boolean; hit: boolean; t: number; x0: number; y0: number; x1: number; y1: number }
interface Particle {
  on: boolean; x: number; y: number; vx: number; vy: number; life: number; max: number;
  c: string; sz: number; confetti: boolean; rot: number; vr: number;
}
interface Medal { text: string; t: number }

interface Game {
  canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D; bg: HTMLCanvasElement;
  glowG: HTMLCanvasElement; glowV: HTMLCanvasElement; glowO: HTMLCanvasElement;
  vigB: HTMLCanvasElement; vigR: HTMLCanvasElement;
  W: number; H: number; dpr: number; k: number; ek: number; hy: number;
  fam: string; fXs: string; fSm: string; fMd: string; fLg: string; fXl: string;
  reduced: boolean; started: boolean; touch: boolean;
  enemies: Enemy[]; bolts: Bolt[]; parts: Particle[]; pi: number; medals: Medal[];
  t: number; px: number; py: number; hasPointer: boolean; firing: boolean; pending: boolean;
  hover: boolean; head: boolean;
  cool: number; bloom: number; ammo: number; reload: number; muzzle: number; tx: number; ty: number;
  shield: number; health: number; sinceHit: number; shieldFlash: number; healthFlash: number; shake: number;
  wave: number; waveState: number; banner: string; sub: string; bannerT: number;
  queue: number[]; qi: number; spawnT: number; remaining: number;
  score: number; kills: number; medalCount: number; multi: number; lastKill: number; spree: number;
}

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);

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
  return c.getContext("2d") as CanvasRenderingContext2D;
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

function newEnemy(): Enemy {
  return {
    on: false, elite: false, d: 0, targetD: 0.7, speed: 0.1, ex: 0, exBase: 0, ph: 0, freq: 1, amp: 0,
    hp: 1, shield: 0, state: 0, panicT: 0, fireT: 0, flash: 0, shimmer: 0, breakT: 0, dieT: 0, dir: 1,
    walk: 0, sx: 0, sy: 0, sc: 1,
  };
}

function createGame(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): Game {
  const root = getComputedStyle(document.documentElement).getPropertyValue("--font-barlow-condensed").trim();
  const enemies: Enemy[] = [];
  for (let i = 0; i < MAX_ENEMIES; i++) enemies.push(newEnemy());
  const bolts: Bolt[] = [];
  for (let i = 0; i < MAX_BOLTS; i++) bolts.push({ on: false, elite: false, hit: false, t: 0, x0: 0, y0: 0, x1: 0, y1: 0 });
  const parts: Particle[] = [];
  for (let i = 0; i < MAX_PARTS; i++)
    parts.push({ on: false, x: 0, y: 0, vx: 0, vy: 0, life: 0, max: 1, c: HOLO, sz: 2, confetti: false, rot: 0, vr: 0 });
  return {
    canvas, ctx, bg: makeCanvas(1, 1),
    glowG: makeGlow("125,255,106"), glowV: makeGlow("143,123,255"), glowO: makeGlow("255,170,60"),
    vigB: makeVignette("92,214,255"), vigR: makeVignette("255,42,31"),
    W: 1, H: 1, dpr: 1, k: 1, ek: 1, hy: 0,
    fam: root ? `${root}, sans-serif` : "sans-serif", fXs: "", fSm: "", fMd: "", fLg: "", fXl: "",
    reduced: window.matchMedia("(prefers-reduced-motion: reduce)").matches, started: false, touch: false,
    enemies, bolts, parts, pi: 0, medals: [],
    t: 0, px: 0, py: 0, hasPointer: false, firing: false, pending: false, hover: false, head: false,
    cool: 0, bloom: 0, ammo: MAG, reload: 0, muzzle: 0, tx: 0, ty: 0,
    shield: 100, health: 100, sinceHit: 99, shieldFlash: 0, healthFlash: 0, shake: 0,
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
  g.medals.length = 0;
  g.shield = 100; g.health = 100; g.sinceHit = 99; g.shieldFlash = 0; g.healthFlash = 0; g.shake = 0;
  g.ammo = MAG; g.reload = 0; g.cool = 0; g.bloom = 0; g.firing = false; g.pending = false; g.muzzle = 0;
  g.score = 0; g.kills = 0; g.medalCount = 0; g.multi = 0; g.lastKill = -99; g.spree = 0;
  startWave(g, 1);
}

function startWave(g: Game, n: number) {
  g.wave = n;
  const total = 4 + 2 * n;
  const elites = n >= 2 ? Math.floor(n / 2) : 0;
  g.queue.length = 0;
  for (let i = 0; i < total; i++) g.queue.push(0);
  for (let i = 0; i < elites; i++) g.queue[Math.min(total - 1, Math.floor(((i + 1) * total) / (elites + 1)))] = 1;
  g.qi = 0;
  g.spawnT = 1.4;
  g.waveState = 1;
  g.banner = `WAVE ${n}`;
  g.sub = n === 1 ? "Hostiles inbound" : "Reinforcements inbound";
  g.bannerT = 1.8;
}

function spawnEnemy(g: Game, elite: boolean) {
  let e: Enemy | null = null;
  for (const c of g.enemies) if (!c.on) { e = c; break; }
  if (!e) return;
  e.on = true; e.elite = elite; e.d = 0.01; e.state = 0; e.dieT = 0; e.flash = 0; e.shimmer = 0; e.breakT = 0;
  e.exBase = rand(-0.72, 0.72); e.ex = e.exBase; e.ph = rand(0, TAU); e.freq = rand(0.5, 1.1); e.amp = 0.06;
  e.targetD = elite ? rand(0.6, 0.7) : rand(0.62, 0.78);
  e.speed = elite ? 0.085 : 0.11;
  e.hp = elite ? 2 : 1; e.shield = elite ? 3 : 0;
  e.fireT = rand(0.8, 2); e.walk = rand(0, TAU); e.dir = Math.random() < 0.5 ? -1 : 1;
  project(g, e);
}

function project(g: Game, e: Enemy) {
  e.sy = g.hy + Math.pow(e.d, 1.6) * (g.H * 0.92 - g.hy);
  e.sc = (0.12 + e.d * 0.95) * g.ek * 0.9;
  e.sx = g.W / 2 + e.ex * g.W * 0.46 * (0.25 + 0.75 * e.d);
}

const byDepth = (a: Enemy, b: Enemy) => (a.on ? a.d : -1) - (b.on ? b.d : -1);

function hitTest(g: Game, x: number, y: number): Enemy | null {
  for (let i = g.enemies.length - 1; i >= 0; i--) {
    const e = g.enemies[i];
    if (!e.on || e.dieT > 0) continue;
    const hw = (e.elite ? 21 : 19) * e.sc, hh = (e.elite ? 114 : 60) * e.sc;
    if (x >= e.sx - hw && x <= e.sx + hw && y >= e.sy - hh && y <= e.sy) {
      g.head = y <= e.sy - hh * 0.7;
      return e;
    }
  }
  return null;
}

function part(g: Game) {
  const p = g.parts[g.pi];
  g.pi = (g.pi + 1) % MAX_PARTS;
  return p;
}
function burst(g: Game, x: number, y: number, n: number, c: string, life: number) {
  for (let i = 0; i < n; i++) {
    const p = part(g), a = rand(0, TAU), s = rand(60, 260) * g.k;
    p.on = true; p.x = x; p.y = y; p.vx = Math.cos(a) * s; p.vy = Math.sin(a) * s - 60 * g.k;
    p.life = p.max = life * rand(0.6, 1); p.c = c; p.sz = rand(1.5, 3) * g.k; p.confetti = false;
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

function addMedal(g: Game, text: string, pts: number) {
  g.score += pts;
  g.medalCount++;
  g.medals.unshift({ text, t: 0 });
  if (g.medals.length > 3) g.medals.pop();
}

function kill(g: Game, e: Enemy, head: boolean) {
  e.dieT = DIE;
  g.kills++;
  g.score += e.elite ? 250 : 100;
  burst(g, e.sx, e.sy - (e.elite ? 70 : 34) * e.sc, e.elite ? 14 : 10, e.elite ? "#b58cff" : "#7fc4ff", 0.5);
  if (head) {
    g.score += 50;
    addMedal(g, "Headshot", 0);
    if (!e.elite) confetti(g, e.sx, e.sy - 52 * e.sc);
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
  if (e.elite) {
    for (const o of g.enemies) {
      if (o.on && !o.elite && o.dieT <= 0 && Math.abs(o.ex - e.ex) < 0.25) {
        o.state = 2;
        o.panicT = 1.5;
      }
    }
  }
}

function hitEnemy(g: Game, e: Enemy, head: boolean, x: number, y: number) {
  if (e.elite && e.shield > 0) {
    e.shield--;
    e.shimmer = 0.2;
    burst(g, x, y, 6, "#c8f4ff", 0.3);
    if (e.shield === 0) {
      e.breakT = 0.35;
      burst(g, x, y, 14, "#8fe9ff", 0.45);
    }
    return;
  }
  e.flash = 0.07;
  burst(g, x, y, 6, e.elite ? "#b58cff" : "#7fc4ff", 0.35);
  e.hp = head ? 0 : e.hp - 1;
  if (e.hp <= 0) kill(g, e, head);
}

function startReload(g: Game) {
  if (g.reload > 0 || g.ammo === MAG) return;
  g.reload = RELOAD;
  g.pending = false;
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
  const e = hitTest(g, x, y);
  if (e) hitEnemy(g, e, g.head, x, y);
  else burst(g, x, y, 3, "#9fb4c8", 0.25);
  if (g.ammo <= 0) startReload(g);
}

function boltX(e: Enemy) { return e.sx + (e.elite ? 22 : 18) * e.sc; }
function boltY(e: Enemy) { return e.sy - (e.elite ? 60 : 24) * e.sc; }

function fireBolt(g: Game, e: Enemy) {
  let b: Bolt | null = null;
  for (const c of g.bolts) if (!c.on) { b = c; break; }
  if (!b) return;
  b.on = true; b.elite = e.elite; b.t = 0; b.x0 = boltX(e); b.y0 = boltY(e);
  b.hit = Math.random() > 0.35;
  if (b.hit) {
    b.x1 = g.W / 2 + rand(-0.08, 0.08) * g.W;
    b.y1 = g.H * rand(0.45, 0.62);
  } else {
    b.x1 = g.W / 2 + (Math.random() < 0.5 ? -1 : 1) * g.W * rand(0.55, 0.8);
    b.y1 = g.H * rand(0.1, 1.1);
  }
}

function hurt(g: Game, amt: number) {
  g.sinceHit = 0;
  g.spree = 0;
  g.shake = 0.25;
  if (g.shield > 0) {
    const a = Math.min(g.shield, amt);
    g.shield -= a;
    amt -= a;
    g.shieldFlash = 1;
  }
  if (amt > 0) {
    g.health = Math.max(0, g.health - amt);
    g.healthFlash = 1;
  }
}

function update(g: Game, dt: number) {
  g.t += dt;
  g.muzzle = Math.max(0, g.muzzle - dt);
  g.shieldFlash = Math.max(0, g.shieldFlash - dt * 2.5);
  g.healthFlash = Math.max(0, g.healthFlash - dt * 2);
  g.shake = Math.max(0, g.shake - dt);
  g.bannerT -= dt;
  for (const m of g.medals) m.t += dt;
  while (g.medals.length && g.medals[g.medals.length - 1].t > 1.5) g.medals.pop();

  g.sinceHit += dt;
  if (g.sinceHit > 3 && g.shield < 100) g.shield = Math.min(100, g.shield + 45 * dt);

  g.cool -= dt;
  if (g.reload > 0) {
    g.reload -= dt;
    if (g.reload <= 0) { g.reload = 0; g.ammo = MAG; }
  } else if ((g.firing || g.pending) && g.cool <= 0) {
    if (g.ammo > 0) { shoot(g); g.pending = false; } else startReload(g);
  }
  if (!g.firing) g.bloom = Math.max(0, g.bloom - dt * 4);

  const n = g.wave;
  const spdMul = 1 + 0.05 * (n - 1), fireMul = Math.max(0.55, 1 - 0.05 * (n - 1));
  let alive = 0, onCount = 0;
  for (const e of g.enemies) {
    if (!e.on) continue;
    onCount++;
    e.flash -= dt; e.shimmer -= dt; e.breakT -= dt;
    if (e.dieT > 0) {
      e.dieT -= dt;
      if (e.dieT <= 0) e.on = false;
      continue;
    }
    alive++;
    let ampT = 0.06;
    if (e.state === 0) {
      e.walk += dt * 8;
      e.d = Math.min(e.targetD, e.d + e.speed * spdMul * dt);
      if (e.d >= e.targetD) e.state = 1;
    } else if (e.state === 1) {
      e.walk += dt * 4;
      ampT = e.elite ? 0.26 : 0.2;
      e.fireT -= dt;
      if (e.fireT <= 0) { fireBolt(g, e); e.fireT = rand(1.6, 3.2) * fireMul; }
    } else {
      e.walk += dt * 16;
      e.d = Math.max(0.04, e.d - 0.24 * dt);
      e.panicT -= dt;
      if (e.panicT <= 0) e.state = 0;
    }
    e.amp += (ampT - e.amp) * Math.min(1, dt * 1.2);
    e.ex = clamp(e.exBase + Math.sin(g.t * e.freq + e.ph) * e.amp, -0.95, 0.95);
    project(g, e);
  }
  g.enemies.sort(byDepth);

  if (g.waveState === 1) {
    if (g.qi < g.queue.length) {
      g.spawnT -= dt;
      if (g.spawnT <= 0 && alive < Math.min(8, 3 + Math.ceil(n * 0.6))) {
        spawnEnemy(g, g.queue[g.qi++] === 1);
        g.spawnT = Math.max(0.55, 1.8 - n * 0.1) + rand(0, 0.9);
      }
    } else if (onCount === 0) {
      g.waveState = 2;
      g.bannerT = 2;
      g.banner = `WAVE ${n} COMPLETE`;
      g.sub = g.health < 100 ? "+25 health" : "Hold the line";
      g.health = Math.min(100, g.health + 25);
    }
  } else if (g.waveState === 2 && g.bannerT <= 0) startWave(g, n + 1);
  g.remaining = g.queue.length - g.qi + alive;

  for (const b of g.bolts) {
    if (!b.on) continue;
    b.t += dt / 0.55;
    if (b.t >= 1) {
      b.on = false;
      if (b.hit) hurt(g, b.elite ? 14 : 8);
    }
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
}

/* ---------- drawing ---------- */

function drawGrunt(x: CanvasRenderingContext2D, e: Enemy) {
  const fl = e.flash > 0, panic = e.state === 2;
  const body = fl ? "#ffffff" : "#4a5a78", step = Math.sin(e.walk) * 3;
  x.fillStyle = "rgba(0,0,0,0.45)";
  x.beginPath(); x.ellipse(0, 0, 18, 4, 0, 0, TAU); x.fill();
  x.fillStyle = fl ? "#ffffff" : "#334058";
  const l = Math.max(0, step), r = Math.max(0, -step);
  x.fillRect(-11, -12 - l, 8, 12);
  x.fillRect(3, -12 - r, 8, 12);
  const tank = () => {
    x.fillStyle = fl ? "#ffffff" : "#3fc7b0";
    x.beginPath(); x.roundRect(-13, -61, 26, 24, 6); x.fill();
    x.fillStyle = "#2a8f80"; x.fillRect(-13, -52, 26, 3);
  };
  if (!panic) tank();
  x.fillStyle = body;
  if (panic) { x.fillRect(-22, -66, 6, 24); x.fillRect(16, -66, 6, 24); }
  else { x.fillRect(-22, -38 + step * 0.5, 6, 18); x.fillRect(16, -38 - step * 0.5, 6, 18); }
  x.beginPath(); x.moveTo(-17, -44); x.lineTo(17, -44); x.lineTo(14, -10); x.lineTo(-14, -10); x.closePath(); x.fill();
  x.beginPath(); x.ellipse(0, -49, 10, 8, 0, 0, TAU); x.fill();
  if (panic) { tank(); return; }
  x.fillStyle = fl ? "#ffffff" : "#d98a2b";
  x.beginPath(); x.moveTo(-13, -43); x.lineTo(13, -43); x.lineTo(9, -20); x.lineTo(0, -15); x.lineTo(-9, -20); x.closePath(); x.fill();
  x.fillStyle = "#a8621a"; x.fillRect(-9, -33, 18, 2);
  x.fillStyle = fl ? "#ffffff" : "#2f9e8d";
  x.beginPath(); x.ellipse(0, -44, 7, 4, 0, 0, TAU); x.fill();
  x.fillStyle = "#ffe07a"; x.fillRect(-6, -53, 3, 2.4); x.fillRect(3, -53, 3, 2.4);
  x.fillStyle = "#1c2a2a"; x.fillRect(13, -27, 9, 6);
  x.fillStyle = "#7dff6a"; x.fillRect(20, -26, 2, 3);
}

function drawElite(x: CanvasRenderingContext2D, e: Enemy) {
  const fl = e.flash > 0, step = Math.sin(e.walk) * 4;
  const armor = fl ? "#ffffff" : "#3552c8", dark = fl ? "#ffffff" : "#1a2140";
  x.fillStyle = "rgba(0,0,0,0.45)";
  x.beginPath(); x.ellipse(0, 0, 22, 5, 0, 0, TAU); x.fill();
  for (let s = -1; s <= 1; s += 2) {
    const lx = s * 9, lift = Math.max(0, s * step);
    x.fillStyle = dark;
    x.beginPath(); x.moveTo(lx - 5, -60); x.lineTo(lx + 5, -60); x.lineTo(lx + 7, -32); x.lineTo(lx + 3, -15);
    x.lineTo(lx + 6, -lift); x.lineTo(lx - 6, -lift); x.lineTo(lx - 4, -16); x.lineTo(lx - 7, -33); x.closePath(); x.fill();
    x.fillStyle = armor; x.fillRect(lx - 6, -60, 12, 17);
  }
  x.fillStyle = dark; x.fillRect(-11, -68, 22, 12);
  x.fillRect(-32, -90, 7, 30); x.fillRect(25, -90, 7, 26);
  x.fillStyle = armor;
  x.beginPath(); x.moveTo(-24, -98); x.lineTo(24, -98); x.lineTo(18, -74); x.lineTo(8, -64); x.lineTo(-8, -64); x.lineTo(-18, -74); x.closePath(); x.fill();
  x.beginPath(); x.ellipse(-25, -93, 9, 7, 0, 0, TAU); x.ellipse(25, -93, 9, 7, 0, 0, TAU); x.fill();
  x.fillStyle = "rgba(170,195,255,0.35)";
  x.beginPath(); x.moveTo(-14, -96); x.lineTo(-4, -96); x.lineTo(-6, -76); x.lineTo(-12, -80); x.closePath(); x.fill();
  x.fillStyle = "#2b2f55";
  x.beginPath(); x.ellipse(24, -62, 10, 5, 0.35, 0, TAU); x.fill();
  x.fillStyle = "#8f7bff"; x.fillRect(29, -61, 3, 3);
  x.fillStyle = dark; x.fillRect(-4, -104, 8, 8);
  x.fillStyle = armor;
  x.beginPath(); x.moveTo(-8, -105); x.lineTo(0, -116); x.lineTo(8, -105); x.lineTo(6, -99); x.lineTo(-6, -99); x.closePath(); x.fill();
  x.strokeStyle = fl ? "#ffffff" : "#4a3f5c"; x.lineWidth = 2;
  x.beginPath();
  x.moveTo(-5, -100); x.lineTo(-8, -91); x.moveTo(-2, -99); x.lineTo(-3, -90);
  x.moveTo(2, -99); x.lineTo(3, -90); x.moveTo(5, -100); x.lineTo(8, -91);
  x.stroke();
  x.fillStyle = "#ffd36b"; x.fillRect(-5, -106, 3, 2); x.fillRect(2, -106, 3, 2);
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

function chamferPath(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, cut: number) {
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
  c.textBaseline = "alphabetic";
  c.font = g.fLg; c.fillStyle = g.ammo <= 8 && g.reload <= 0 ? VISOR : INK;
  c.fillText(String(g.reload > 0 ? 0 : g.ammo), right, base);
  if (g.reload > 0 || (g.ammo <= 8 && blink)) {
    c.font = g.fSm; c.fillStyle = VISOR;
    c.fillText(g.reload > 0 ? "RELOADING" : g.touch ? "TAP TO RELOAD" : "R  RELOAD", right, rowTop - 6 * k);
  }
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

  for (const e of g.enemies) {
    if (!e.on) continue;
    c.save();
    c.translate(e.sx, e.sy);
    if (e.dieT > 0) {
      const p = 1 - e.dieT / DIE;
      c.rotate(p * 1.3 * e.dir);
      c.globalAlpha = 1 - p * p;
    }
    c.scale(e.sc, e.sc);
    if (e.elite) drawElite(c, e); else drawGrunt(c, e);
    c.restore();
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
  c.globalCompositeOperation = "lighter";
  for (const e of g.enemies) {
    if (!e.on || e.dieT > 0 || e.state !== 1 || e.fireT > 0.35) continue;
    const p = 1 - e.fireT / 0.35, r = (5 + p * 9) * e.sc;
    c.globalAlpha = 0.4 + 0.6 * p;
    c.drawImage(e.elite ? g.glowV : g.glowG, boltX(e) - r, boltY(e) - r, r * 2, r * 2);
  }
  for (const b of g.bolts) {
    if (!b.on) continue;
    const spr = b.elite ? g.glowV : g.glowG;
    for (let j = 1; j >= 0; j--) {
      const tt = Math.max(0, b.t - j * 0.08), p = tt * tt, r = g.ek * (3 + tt * tt * 26) * (j ? 0.6 : 1);
      const x = b.x0 + (b.x1 - b.x0) * p, y = b.y0 + (b.y1 - b.y0) * p;
      c.globalAlpha = j ? 0.45 : 1;
      c.drawImage(spr, x - r, y - r, r * 2, r * 2);
    }
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

export default function FirefightGame() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Game | null>(null);
  const phaseRef = useRef<Phase>("ready");
  const [phase, setPhase] = useState<Phase>("ready");
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
      try { canvas.setPointerCapture(e.pointerId); } catch { /* ignore */ }
      if (g.px >= g.W - 130 * g.k && g.py >= g.H - 95 * g.k) { startReload(g); return; }
      g.firing = true;
      g.pending = true;
    };
    const onMove = (e: PointerEvent) => setPos(e);
    const onUp = () => { g.firing = false; };
    const onMenu = (e: Event) => { if (phaseRef.current === "playing") e.preventDefault(); };
    const onKey = (e: KeyboardEvent) => {
      const tg = e.target as HTMLElement | null;
      if (tg && (tg.tagName === "INPUT" || tg.tagName === "TEXTAREA" || tg.isContentEditable)) return;
      if (phaseRef.current !== "playing") return;
      if (e.key === "r" || e.key === "R") startReload(g);
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
    resetGame(g);
    phaseRef.current = "playing";
    setPhase("playing");
  };
  const resume = () => {
    phaseRef.current = "playing";
    setPhase("playing");
  };
  const pause = () => {
    const g = gameRef.current;
    if (g) g.firing = false;
    phaseRef.current = "paused";
    setPhase("paused");
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
        <button
          type="button"
          onClick={pause}
          className="absolute bottom-3 left-3 border border-line bg-void/60 px-3 py-1 font-hud text-xs uppercase tracking-[0.2em] text-muted hover:text-ink"
        >
          Pause
        </button>
      )}
      {!playing && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-void/70 px-6 text-center backdrop-blur-sm">
          {phase === "ready" && (
            <>
              <p className="font-hud text-xs uppercase tracking-[0.35em] text-holo">Horde mode // Installation 04</p>
              <h3 className="font-display text-4xl uppercase text-ink">Firefight</h3>
              <p className="max-w-md text-muted">Hold to fire, R to reload. Survive as many waves as you can.</p>
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
