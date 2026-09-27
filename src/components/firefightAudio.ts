/*
 * Firefight sound engine — every sound is synthesized live with the Web Audio API.
 * No audio files, no samples. SSR-safe: nothing touches `window` until a function runs.
 */

export type Sfx =
  | "rifle"
  | "reload"
  | "dryfire"
  | "plasmaGrunt"
  | "plasmaElite"
  | "needle"
  | "shieldHit"
  | "healthHit"
  | "shieldBreak"
  | "shieldRecharge"
  | "eliteShieldPop"
  | "enemyHit"
  | "gruntDeath"
  | "eliteDeath"
  | "jackalDeath"
  | "droneDeath"
  | "gruntPanic"
  | "eliteRoar"
  | "headshot"
  | "grenadeThrow"
  | "grenadeBoom"
  | "medal"
  | "waveStart"
  | "waveComplete"
  | "gameOver"
  | "ui";

interface Voice {
  c: AudioContext;
  nb: AudioBuffer;
  out: GainNode;
  rate: number;
  nodes: AudioNode[];
  pending: number;
}

type Recipe = (v: Voice, t: number) => void;
type Pt = readonly [number, number];

const MUTE_KEY = "firefight-muted";
const MASTER = 0.5;
const MAX_VOICES = 24;
const EPS = 0.0001;
const THROTTLE_MS: Partial<Record<Sfx, number>> = { rifle: 70, enemyHit: 50 };

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let noiseBuf: AudioBuffer | null = null;
let active = 0;
let mutedCache: boolean | null = null;
let alarmOn = false;
let alarmTimer: number | null = null;
const lastAt: Partial<Record<Sfx, number>> = {};

const clamp = (x: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, x));
const rnd = (a: number, b: number): number => a + Math.random() * (b - a);

/* ---------------------------------------------------------------- plumbing */

function add<T extends AudioNode>(v: Voice, n: T): T {
  v.nodes.push(n);
  return n;
}

/** Registers a source with its voice; when the last source ends the whole voice is torn down. */
function run(v: Voice, s: AudioScheduledSourceNode, stopAt: number): void {
  v.pending++;
  s.onended = () => {
    v.pending--;
    if (v.pending > 0) return;
    for (const n of v.nodes) {
      try {
        n.disconnect();
      } catch {
        /* already disconnected */
      }
    }
    active = Math.max(0, active - 1);
  };
  s.stop(stopAt);
}

function env(p: AudioParam, t: number, a: number, peak: number, dur: number, hold = 0): void {
  const pk = Math.max(peak, EPS * 2);
  p.setValueAtTime(EPS, t);
  p.exponentialRampToValueAtTime(pk, t + a);
  if (hold > 0) p.setValueAtTime(pk, t + a + hold);
  p.exponentialRampToValueAtTime(EPS, t + Math.max(dur, a + hold + 0.005));
}

function sweep(p: AudioParam, t: number, pts: readonly Pt[], k = 1): void {
  for (const [dt, val] of pts) p.exponentialRampToValueAtTime(Math.max(val * k, EPS), t + dt);
}

function filt(
  v: Voice, type: BiquadFilterType, f0: number, f1: number, t: number, dur: number, q = 1,
  dest: AudioNode = v.out,
): BiquadFilterNode {
  const f = add(v, v.c.createBiquadFilter());
  f.type = type;
  f.Q.value = q;
  f.frequency.setValueAtTime(clamp(f0 * v.rate, 20, 18000), t);
  if (f1 !== f0) f.frequency.exponentialRampToValueAtTime(clamp(f1 * v.rate, 20, 18000), t + dur);
  f.connect(dest);
  return f;
}

function tone(
  v: Voice, type: OscillatorType, f0: number, f1: number, t: number, dur: number, peak: number,
  a = 0.005, dest: AudioNode = v.out, hold = 0, detune = 0,
): OscillatorNode {
  const o = add(v, v.c.createOscillator());
  const g = add(v, v.c.createGain());
  o.type = type;
  o.detune.value = detune;
  o.frequency.setValueAtTime(f0 * v.rate, t);
  if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1 * v.rate, t + dur);
  env(g.gain, t, a, peak, dur, hold);
  o.connect(g).connect(dest);
  o.start(t);
  run(v, o, t + dur + 0.03);
  return o;
}

function noise(
  v: Voice, t: number, dur: number, peak: number, type: BiquadFilterType, f0: number, f1: number,
  q = 1, a = 0.002, dest: AudioNode = v.out,
): void {
  const s = add(v, v.c.createBufferSource());
  s.buffer = v.nb;
  s.loop = true;
  const g = add(v, v.c.createGain());
  env(g.gain, t, a, peak, dur);
  s.connect(filt(v, type, f0, f1, t, dur, q, g));
  g.connect(dest);
  s.start(t, rnd(0, 0.9));
  run(v, s, t + dur + 0.03);
}

/** LFO / FM modulator into an AudioParam. Returns its depth gain so callers can automate it. */
function mod(
  v: Voice, type: OscillatorType, f: number, depth: number, target: AudioParam, t: number, dur: number,
  f1 = f,
): GainNode {
  const o = add(v, v.c.createOscillator());
  const g = add(v, v.c.createGain());
  o.type = type;
  o.frequency.setValueAtTime(f, t);
  if (f1 !== f) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  g.gain.setValueAtTime(depth, t);
  o.connect(g).connect(target);
  o.start(t);
  run(v, o, t + dur + 0.03);
  return g;
}

function bus(v: Voice, gain: number, dest: AudioNode = v.out): GainNode {
  const g = add(v, v.c.createGain());
  g.gain.value = gain;
  g.connect(dest);
  return g;
}

/* ------------------------------------------------------------- instruments */

function click(v: Voice, t: number, p: number, pk: number): void {
  noise(v, t, 0.03, pk, "bandpass", 3200 * p, 1800 * p, 3, 0.001);
  tone(v, "square", 1500 * p, 500 * p, t, 0.022, pk * 0.25, 0.001);
}

function yelp(v: Voice, t: number, f: number, dur: number, peak: number): void {
  const bp = filt(v, "bandpass", f * 1.8, f * 1.3, t, dur, 2.5);
  const o = tone(v, "sawtooth", f, f, t, dur, peak, 0.008, bp);
  sweep(o.frequency, t, [[dur * 0.3, f * 1.7], [dur, f * 0.55]], v.rate);
  mod(v, "sine", 28, f * 0.06, o.frequency, t, dur);
}

function growl(v: Voice, t: number, dur: number, pts: readonly Pt[], peak: number, lp0: number, lp1: number): void {
  const lp = filt(v, "lowpass", lp0, lp1, t, dur, 3);
  const trem = bus(v, 0.7, lp);
  mod(v, "square", 26, 0.3, trem.gain, t, dur);
  for (const d of [-14, 0, 12]) {
    const o = tone(v, "sawtooth", pts[0][1], pts[0][1], t, dur, peak, 0.04, trem, dur * 0.4, d);
    sweep(o.frequency, t, pts.slice(1), v.rate);
  }
  noise(v, t, dur, peak * 0.8, "bandpass", 700, 400, 1.5, 0.05, lp);
}

function notes(v: Voice, t: number, fs: readonly number[], step: number, last: number, peak: number, type: OscillatorType, lp: number): void {
  const f = filt(v, "lowpass", lp, lp, t, 0.1, 0.8);
  fs.forEach((n, i) => {
    const d = i === fs.length - 1 ? last : step * 1.6;
    tone(v, type, n, n, t + i * step, d, peak, 0.01, f, d * 0.3);
    tone(v, "sine", n * 2, n * 2, t + i * step, d * 0.8, peak * 0.3, 0.01, f);
  });
}

const R: Record<Sfx, Recipe> = {
  rifle: (v, t) => {
    const r = rnd(0.9, 1.1);
    noise(v, t, 0.075, 0.38, "bandpass", 2400 * r, 800 * r, 0.8, 0.001);
    noise(v, t, 0.035, 0.12, "highpass", 6000, 4000, 0.7, 0.001);
    tone(v, "sine", 170 * r, 50, t, 0.09, 0.17, 0.002);
  },
  reload: (v, t) => {
    click(v, t, 1, 0.35);
    click(v, t + 0.5, 1.25, 0.4);
    noise(v, t + 1.08, 0.12, 0.2, "bandpass", 1600, 3600, 3, 0.01);
    click(v, t + 1.1, 0.8, 0.3);
    click(v, t + 1.21, 1.4, 0.4);
  },
  dryfire: (v, t) => click(v, t, 1.6, 0.3),
  plasmaGrunt: (v, t) => {
    const o = tone(v, "sine", 1800, 260, t, 0.2, 0.32, 0.003);
    mod(v, "sine", 900 * v.rate, 700 * v.rate, o.frequency, t, 0.2, 130 * v.rate);
    tone(v, "triangle", 2600, 600, t, 0.07, 0.1, 0.002);
  },
  plasmaElite: (v, t) => {
    const lp = filt(v, "lowpass", 2600, 500, t, 0.15, 5);
    const o = tone(v, "sawtooth", 720, 170, t, 0.15, 0.3, 0.003, lp);
    mod(v, "square", 70, 120 * v.rate, o.frequency, t, 0.15);
    tone(v, "square", 360, 90, t, 0.12, 0.08, 0.003, lp);
  },
  needle: (v, t) => {
    for (const [f, pk] of [[2900, 0.18], [4350, 0.12], [8000, 0.06]] as const) {
      tone(v, "sine", f, f * 0.92, t, 0.28, pk, 0.002);
    }
    noise(v, t, 0.05, 0.12, "highpass", 8000, 9000, 0.7, 0.001);
  },
  shieldHit: (v, t) => {
    const rm = bus(v, 0);
    mod(v, "square", 1700, 1, rm.gain, t, 0.22, 900);
    noise(v, t, 0.2, 0.7, "bandpass", 4200, 1800, 1.5, 0.002, rm);
    tone(v, "sawtooth", 1300, 420, t, 0.1, 0.1, 0.002);
  },
  healthHit: (v, t) => {
    tone(v, "sine", 120, 42, t, 0.2, 0.5, 0.003);
    noise(v, t, 0.2, 0.4, "lowpass", 700, 180, 1, 0.003);
    noise(v, t + 0.02, 0.18, 0.25, "bandpass", 380, 280, 5, 0.02);
  },
  shieldBreak: (v, t) => {
    const lp = filt(v, "lowpass", 6000, 300, t, 0.45, 2);
    tone(v, "sawtooth", 1500, 90, t, 0.45, 0.3, 0.002, lp);
    const rm = bus(v, 0);
    mod(v, "square", 2300, 1, rm.gain, t, 0.3, 400);
    noise(v, t, 0.3, 0.6, "bandpass", 5000, 700, 1.2, 0.001, rm);
    tone(v, "square", 2200, 300, t, 0.12, 0.08, 0.001);
  },
  shieldRecharge: (v, t) => {
    const d = 1.15;
    const lp = filt(v, "lowpass", 1400, 6000, t, d, 0.7);
    const a = tone(v, "sine", 300, 1400, t, d, 0.34, 0.28, lp, 0.6);
    const b = tone(v, "triangle", 600, 2800, t, d, 0.09, 0.35, lp, 0.55, 7);
    const c = tone(v, "sine", 302, 1412, t, d, 0.13, 0.3, lp, 0.6, -6);
    for (const [o, k] of [[a, 1], [b, 2], [c, 1]] as const) {
      mod(v, "sine", 6, 6 * k, o.frequency, t, d, 11).gain.linearRampToValueAtTime(30 * k, t + d);
    }
    noise(v, t, d, 0.05, "bandpass", 900, 4500, 4, 0.4);
  },
  eliteShieldPop: (v, t) => {
    noise(v, t, 0.1, 0.45, "highpass", 3000, 7000, 0.8, 0.001);
    tone(v, "square", 2100, 500, t, 0.1, 0.08, 0.001);
    for (let i = 0; i < 5; i++) {
      const f = rnd(3000, 6500);
      tone(v, "sine", f, f * 1.05, t + 0.02 + i * 0.025, 0.12, 0.1, 0.002);
    }
  },
  enemyHit: (v, t) => {
    const r = rnd(0.85, 1.15);
    tone(v, "square", 3200 * r, 2600 * r, t, 0.03, 0.06, 0.001);
    noise(v, t, 0.04, 0.25, "bandpass", 5200 * r, 4000 * r, 8, 0.001);
  },
  gruntDeath: (v, t) => {
    const f = rnd(650, 800);
    yelp(v, t, f, 0.38, 0.4);
    yelp(v, t + 0.02, f * 1.5, 0.3, 0.12);
  },
  eliteDeath: (v, t) => growl(v, t, 0.9, [[0, 120], [0.25, 105], [0.9, 48]], 0.14, 1800, 180),
  jackalDeath: (v, t) => {
    const bp = filt(v, "bandpass", 2600, 1800, t, 0.4, 3);
    const o = tone(v, "sawtooth", 1700, 1700, t, 0.4, 0.3, 0.01, bp);
    sweep(o.frequency, t, [[0.1, 2400], [0.4, 800]], v.rate);
    mod(v, "square", 170, 450 * v.rate, o.frequency, t, 0.4);
    noise(v, t, 0.35, 0.25, "bandpass", 3200, 2000, 2, 0.01);
  },
  droneDeath: (v, t) => {
    const bp = filt(v, "bandpass", 1300, 800, t, 0.5, 2);
    const am = bus(v, 0.6, bp);
    mod(v, "square", 42, 0.4, am.gain, t, 0.5, 20);
    const o = tone(v, "sawtooth", 190, 120, t, 0.5, 0.45, 0.01, am, 0.42);
    mod(v, "sine", 9, 25, o.frequency, t, 0.5);
    noise(v, t + 0.46, 0.06, 0.35, "highpass", 2000, 1000, 0.8, 0.001);
  },
  gruntPanic: (v, t) => {
    for (let i = 0; i < 4; i++) yelp(v, t + i * 0.13 + rnd(0, 0.03), rnd(900, 1350), 0.11, 0.26);
  },
  eliteRoar: (v, t) => growl(v, t, 0.8, [[0, 85], [0.3, 135], [0.8, 70]], 0.16, 500, 1600),
  headshot: (v, t) => {
    const bp = filt(v, "bandpass", 1400, 1900, t, 0.35, 1.5);
    const o = tone(v, "sawtooth", 470, 540, t, 0.34, 0.3, 0.01, bp, 0.2);
    mod(v, "sine", 22, 18, o.frequency, t, 0.34);
    tone(v, "square", 940, 1080, t, 0.34, 0.05, 0.01, bp, 0.2);
    for (let i = 0; i < 6; i++) {
      const s = t + 0.36 + i * 0.045 + rnd(0, 0.02);
      noise(v, s, 0.07, 0.14, "bandpass", rnd(2800, 5500), rnd(4000, 7000), 4, 0.004);
      tone(v, "sine", rnd(1100, 1500), rnd(2200, 2800), s, 0.08, 0.06, 0.004);
    }
  },
  grenadeThrow: (v, t) => noise(v, t, 0.38, 0.35, "bandpass", 350, 1900, 1.6, 0.14),
  grenadeBoom: (v, t) => {
    noise(v, t, 0.95, 0.95, "lowpass", 3500, 120, 0.9, 0.004);
    noise(v, t, 0.09, 0.4, "highpass", 1800, 800, 0.7, 0.001);
    tone(v, "sine", 95, 32, t, 0.7, 0.9, 0.004);
  },
  medal: (v, t) => notes(v, t, [988, 1319, 1976], 0.075, 0.45, 0.2, "triangle", 6000),
  waveStart: (v, t) => {
    const lp = filt(v, "lowpass", 400, 900, t, 1.4, 1.2);
    for (const d of [-8, 0, 9]) {
      tone(v, "sawtooth", 110, 110, t, 0.55, 0.1, 0.08, lp, 0.3, d);
      tone(v, "sawtooth", 82.4, 80, t + 0.5, 0.95, 0.11, 0.1, lp, 0.45, d);
    }
    tone(v, "sine", 55, 41, t + 0.5, 0.95, 0.25, 0.1, v.out, 0.4);
  },
  waveComplete: (v, t) => notes(v, t, [523, 659, 784, 1047], 0.11, 0.7, 0.18, "square", 3200),
  gameOver: (v, t) => notes(v, t, [330, 262, 220, 165], 0.2, 1.1, 0.2, "sawtooth", 1200),
  ui: (v, t) => {
    tone(v, "sine", 1800, 1100, t, 0.035, 0.12, 0.002);
    noise(v, t, 0.02, 0.05, "highpass", 5000, 5000, 0.7, 0.001);
  },
};

/* ------------------------------------------------------------------ public */

function newVoice(vol: number, pan: number, rate: number): Voice | null {
  if (!ctx || !master || !noiseBuf || active >= MAX_VOICES) return null;
  const out = ctx.createGain();
  out.gain.value = vol;
  const nodes: AudioNode[] = [out];
  if (pan !== 0 && typeof ctx.createStereoPanner === "function") {
    const p = ctx.createStereoPanner();
    p.pan.value = pan;
    out.connect(p).connect(master);
    nodes.push(p);
  } else {
    out.connect(master);
  }
  active++;
  return { c: ctx, nb: noiseBuf, out, rate, nodes, pending: 0 };
}

function startAlarm(): void {
  if (alarmTimer !== null || typeof window === "undefined" || !ctx || isMuted()) return;
  const beep = (): void => {
    if (!ctx || ctx.state !== "running" || isMuted()) return;
    const v = newVoice(1, 0, 1);
    if (!v) return;
    const t = ctx.currentTime + 0.005;
    const lp = filt(v, "lowpass", 2400, 2400, t, 0.1, 0.7);
    tone(v, "square", 880, 880, t, 0.075, 0.1, 0.003, lp, 0.035);
  };
  beep();
  alarmTimer = window.setInterval(beep, 250);
}

function stopAlarm(): void {
  if (alarmTimer !== null && typeof window !== "undefined") window.clearInterval(alarmTimer);
  alarmTimer = null;
}

export function initAudio(): void {
  if (typeof window === "undefined") return;
  if (!ctx) {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    try {
      ctx = new Ctor();
    } catch {
      return;
    }
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16;
    comp.knee.value = 10;
    comp.ratio.value = 4;
    comp.attack.value = 0.003;
    comp.release.value = 0.2;
    master = ctx.createGain();
    master.gain.value = isMuted() ? 0 : MASTER;
    master.connect(comp).connect(ctx.destination);
    const len = ctx.sampleRate;
    noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  }
  resumeAudio();
  if (alarmOn) startAlarm();
}

export function play(name: Sfx, opts?: { volume?: number; pan?: number; rate?: number }): void {
  if (!ctx || ctx.state !== "running" || isMuted()) return;
  const gap = THROTTLE_MS[name];
  if (gap !== undefined) {
    const now = performance.now();
    if (now - (lastAt[name] ?? -Infinity) < gap) return;
    lastAt[name] = now;
  }
  const v = newVoice(
    clamp(opts?.volume ?? 1, 0, 1),
    clamp(opts?.pan ?? 0, -1, 1),
    clamp(opts?.rate ?? 1, 0.25, 4),
  );
  if (!v) return;
  R[name](v, ctx.currentTime + 0.005);
}

export function setAlarm(on: boolean): void {
  alarmOn = on;
  if (on) startAlarm();
  else stopAlarm();
}

export function setMuted(muted: boolean): void {
  mutedCache = muted;
  try {
    window.localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
  } catch {
    /* storage unavailable */
  }
  if (ctx && master) master.gain.setTargetAtTime(muted ? 0 : MASTER, ctx.currentTime, 0.02);
  if (muted) stopAlarm();
  else if (alarmOn) startAlarm();
}

export function isMuted(): boolean {
  if (mutedCache !== null) return mutedCache;
  try {
    mutedCache = typeof window !== "undefined" && window.localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    mutedCache = false;
  }
  return mutedCache;
}

export function suspendAudio(): void {
  if (ctx && ctx.state === "running") void ctx.suspend().catch(() => undefined);
}

export function resumeAudio(): void {
  if (ctx && ctx.state === "suspended") void ctx.resume().catch(() => undefined);
}
