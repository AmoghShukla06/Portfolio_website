import type { ReactElement } from "react";

export type SchematicKind =
  | "chess" | "candles" | "neural" | "wireframe" | "dashboard" | "terminal"
  | "globe" | "converter" | "game" | "mobile" | "transit";

/* ---------- shared primitives ---------- */

type P = readonly [number, number];
type P3 = { x: number; y: number; z: number };

const H = "var(--holo)";
const V = "var(--visor)";
const D = Math.PI / 180;
const f = (n: number) => Math.round(n * 10) / 10;
const xy = ([x, y]: P) => `${f(x)} ${f(y)}`;
const poly = (ps: readonly P[], close = false) =>
  ps.map((p, i) => `${i ? "L" : "M"}${xy(p)}`).join("") + (close ? "Z" : "");

const S = { stroke: H, strokeWidth: 1.25, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const dim = (o = 0.25, w = 1) => ({ ...S, strokeWidth: w, strokeOpacity: o });
const tint = (o = 0.08) => ({ fill: H, fillOpacity: o });
const ACCENT = { fill: V, stroke: V, strokeWidth: 1, strokeLinejoin: "round" } as const;

type LabelProps = { x: number; y: number; children: string; anchor?: "start" | "middle" | "end" };
function Label({ x, y, children, anchor = "start" }: LabelProps) {
  return (
    <text x={x} y={y} fontSize={10} fill={H} fillOpacity={0.6} fontFamily="inherit" letterSpacing={1} textAnchor={anchor}>
      {children}
    </text>
  );
}

function Frame({ kind, uid }: { kind: SchematicKind; uid: string }) {
  const id = `grid-${kind}-${uid}`;
  const ticks = [0, 1, 2, 3, 4].map((i) => `M${44 + i * 20} 338V${i % 2 ? 334 : 331}`).join("");
  return (
    <g>
      <defs>
        <pattern id={id} width={16} height={16} patternUnits="userSpaceOnUse">
          <circle cx={8} cy={8} r={0.5} stroke={H} strokeWidth={1} strokeOpacity={0.25} />
        </pattern>
      </defs>
      <rect width={640} height={360} fill={`url(#${id})`} />
      <path d="M12 30V12H30M610 12H628V30M628 330V348H610M30 348H12V330" {...dim(0.35)} />
      <path d={`M44 338H124${ticks}`} {...dim(0.3)} />
    </g>
  );
}

/* ---------- chess: perspective board + alpha-beta tree ---------- */

function Chess() {
  const pt = (u: number, v: number): P => {
    const z = 1 + v * 0.06;
    return [230 + ((u - 4) * 32.5) / z, -296 + 586 / z];
  };
  const sc = (v: number) => 1 / (1 + v * 0.06);
  let dark = "", grid = "", edge = "";
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++)
      if ((r + c) % 2 === 0) dark += poly([pt(c, r), pt(c + 1, r), pt(c + 1, r + 1), pt(c, r + 1)], true);
  for (let i = 1; i < 8; i++) grid += poly([pt(i, 0), pt(i, 8)]) + poly([pt(0, i), pt(8, i)]);
  for (let i = 0; i <= 8; i++) {
    const [x, y] = pt(i, 0), [lx, ly] = pt(0, i);
    edge += `M${f(x)} ${f(y + 5)}v4M${f(lx - 5)} ${f(ly)}h-4`;
  }
  const pieces: [number, number, "p" | "n" | "k"][] = [[6, 0, "k"], [4, 3, "p"], [2, 2, "n"], [5, 5, "p"], [3, 6, "n"], [4, 7, "k"]];
  const a = pt(4.5, 1.5), b = pt(4.5, 3.5);
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]), dx = (b[0] - a[0]) / len, dy = (b[1] - a[1]) / len;
  const tip: P = [b[0] - dx * 6, b[1] - dy * 6];
  const arrow =
    poly([[a[0] + dx * 6, a[1] + dy * 6], tip]) +
    poly([[tip[0] - dx * 7 - dy * 4, tip[1] - dy * 7 + dx * 4], tip, [tip[0] - dx * 7 + dy * 4, tip[1] - dy * 7 - dx * 4]]);

  // search tree: best line highlighted, one subtree pruned (alpha-beta cut)
  const root: P = [396, 188];
  const l1: P[] = [[446, 118], [446, 188], [446, 258]];
  const l2: P[][] = l1.map(([, y]) => [[496, y - 24], [496, y + 24]]);
  const l3: P[] = [[546, 150], [546, 178]];
  const cv = (p: P, q: P) => `M${xy(p)}C${f(p[0] + 22)} ${f(p[1])} ${f(q[0] - 22)} ${f(q[1])} ${xy(q)}`;
  const best = cv(root, l1[1]) + cv(l1[1], l2[1][0]) + cv(l2[1][0], l3[0]);
  const side = cv(root, l1[0]) + cv(root, l1[2]) + cv(l1[0], l2[0][0]) + cv(l1[0], l2[0][1]) + cv(l1[1], l2[1][1]) + cv(l2[1][0], l3[1]);
  const pruned = cv(l1[2], l2[2][0]) + cv(l1[2], l2[2][1]);
  const cuts = l2[2].map((q) => `M${f((l1[2][0] + q[0]) / 2 - 3)} ${f((l1[2][1] + q[1]) / 2 - 3)}l6 6m0 -6l-6 6`).join("");
  const node = (p: P, depth: number, on: boolean, o: number, key: string) =>
    depth % 2 === 0 ? (
      <rect key={key} x={p[0] - 3.5} y={p[1] - 3.5} width={7} height={7} {...S} strokeOpacity={on ? 0.95 : o} {...tint(on ? 0.12 : 0.04)} />
    ) : (
      <circle key={key} cx={p[0]} cy={p[1]} r={3.5} {...S} strokeOpacity={on ? 0.95 : o} {...tint(on ? 0.12 : 0.04)} />
    );

  return (
    <g>
      <path d={dark} {...tint(0.09)} />
      <path d={grid} {...dim(0.3)} />
      <path d={poly([pt(0, 0), pt(8, 0), pt(8, 8), pt(0, 8)], true)} {...S} strokeOpacity={0.9} />
      <path d={edge} {...dim(0.35)} />
      <ellipse cx={f(a[0])} cy={f(a[1])} rx={8} ry={3} {...dim(0.45)} strokeDasharray="2 3" />
      {pieces.map(([u, v, t]) => {
        const [x, y] = pt(u + 0.5, v + 0.5), s = sc(v + 0.5), top = y - 18 * s;
        return (
          <g key={`${u}-${v}`} {...S} strokeOpacity={0.85}>
            <ellipse cx={f(x)} cy={f(y)} rx={f(8 * s)} ry={f(3 * s)} {...tint(0.1)} />
            <path d={`M${f(x)} ${f(y)}V${f(top)}`} />
            {t === "p" ? (
              <circle cx={f(x)} cy={f(top - 3.5 * s)} r={f(3.5 * s)} />
            ) : t === "n" ? (
              <path d={`M${f(x)} ${f(top - 8 * s)}l${f(4 * s)} ${f(4 * s)}l${f(-4 * s)} ${f(4 * s)}l${f(-4 * s)} ${f(-4 * s)}Z`} />
            ) : (
              <path d={`M${f(x)} ${f(top - 10 * s)}v${f(10 * s)}M${f(x - 4 * s)} ${f(top - 6 * s)}h${f(8 * s)}`} />
            )}
          </g>
        );
      })}
      <path d={arrow} stroke={V} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <ellipse className="schem-pulse" cx={f(b[0])} cy={f(b[1])} rx={14} ry={5.5} {...S} />
      <path d={`M${f(pt(8, 3.5)[0] + 4)} 188H391`} {...dim(0.4)} strokeDasharray="2 4" />
      <path d={side} {...dim(0.4)} />
      <path d={pruned} {...dim(0.22)} strokeDasharray="2 3" />
      <path d={cuts} {...dim(0.5)} />
      <path d={best} {...S} strokeWidth={1.5} strokeOpacity={0.95} />
      {node(root, 0, true, 1, "r")}
      {l1.map((p, i) => node(p, 1, i === 1, 0.5, `a${i}`))}
      {l2.flatMap((g, i) => g.map((p, j) => node(p, 2, i === 1 && j === 0, i === 2 ? 0.25 : 0.5, `b${i}${j}`)))}
      {l3.map((p, i) => node(p, 3, i === 0, 0.5, `c${i}`))}
      <path d="M396 304H546M396 300v8M446 302v4M496 302v4M546 300v8" {...dim(0.25)} />
      <Label x={352} y={180}>e2-e4</Label>
      <Label x={396} y={72}>α-β · D3</Label>
    </g>
  );
}

/* ---------- candles: OHLC + equity curve ---------- */

function Candles() {
  const N = 22;
  const mid = (i: number) => 100 + i * 1.9 + 9 * Math.sin(i * 0.8) + 4 * Math.sin(i * 2.1 + 1);
  const data = Array.from({ length: N }, (_, i) => {
    const o = mid(i - 0.6), c = mid(i);
    const hi = Math.max(o, c) + 2 + 3 * Math.abs(Math.sin(i * 1.7));
    return { o, c, hi, lo: Math.min(o, c) - 2 - 3 * Math.abs(Math.cos(i * 1.3)) };
  });
  const lo = Math.min(...data.map((d) => d.lo)), hi = Math.max(...data.map((d) => d.hi));
  const py = (p: number) => 282 - ((p - lo) / (hi - lo)) * 192;
  const cx = (i: number) => 118 + i * 19.4;
  const eqRaw = data.map((_, i) => i + 2.4 * Math.sin(i * 0.9) + 0.02 * i * i);
  const emin = Math.min(...eqRaw), emax = Math.max(...eqRaw);
  const eq: P[] = eqRaw.map((e, i) => [cx(i), 272 - ((e - emin) / (emax - emin)) * 140]);
  const buy: P = [cx(4), py(data[4].lo) + 6], sell: P = [cx(16), py(data[16].hi) - 6];
  const lastY = py(data[N - 1].c);
  const grid = [112, 156, 200, 244].map((y) => `M96 ${y}H548`).join("");
  const xt = Array.from({ length: 8 }, (_, k) => `M${f(cx(k * 3))} 288v5`).join("");

  return (
    <g>
      <path d={grid} {...dim(0.12)} strokeDasharray="2 6" />
      <path d={`M96 64V288H548${xt}`} {...dim(0.45)} />
      <path d={`${poly(eq)}L${f(cx(N - 1))} 288H${f(cx(0))}Z`} {...tint(0.05)} />
      {data.map((d, i) => {
        const x = cx(i), up = d.c >= d.o, top = py(Math.max(d.o, d.c));
        const h = Math.max(py(Math.min(d.o, d.c)) - top, 1.5);
        return (
          <g key={i} className={i === N - 1 ? "schem-pulse" : undefined} {...S} strokeWidth={1} strokeOpacity={up ? 0.85 : 0.45}>
            <path d={`M${f(x)} ${f(py(d.hi))}V${f(top)}M${f(x)} ${f(top + h)}V${f(py(d.lo))}`} />
            <rect x={f(x - 4.5)} y={f(top)} width={9} height={f(h)} rx={1} {...(up ? tint(0.12) : {})} />
          </g>
        );
      })}
      <path d={poly(eq)} {...S} strokeWidth={1.5} strokeOpacity={0.95} />
      <path d={`M${f(buy[0])} ${f(buy[1] + 12)}V288M${f(sell[0])} ${f(sell[1] + 2)}V288`} {...dim(0.2)} strokeDasharray="1 4" />
      <path d={`M${xy(buy)}l5 9h-10ZM${xy(sell)}l5 -9h-10Z`} {...ACCENT} />
      <path d={`M${f(cx(N - 1) + 8)} ${f(lastY)}H548`} {...dim(0.4)} strokeDasharray="2 4" />
      <rect x={550} y={f(lastY - 7)} width={30} height={14} rx={2} {...S} strokeOpacity={0.7} {...tint(0.08)} />
      <Label x={100} y={54}>OHLC · 1H</Label>
      <Label x={548} y={54} anchor="end">Δ +18.2%</Label>
    </g>
  );
}

/* ---------- neural: layered agent graph ---------- */

function Neural() {
  const layers = [3, 4, 5, 4, 2], X = [128, 224, 320, 416, 512], hot = [1, 2, 2, 1, 0];
  const nodes: P[][] = layers.map((n, l) => Array.from({ length: n }, (_, k) => [X[l], 180 + (k - (n - 1) / 2) * 46] as P));
  const cv = (p: P, q: P) =>
    `M${f(p[0] + 10)} ${f(p[1])}C${f(p[0] + 48)} ${f(p[1])} ${f(q[0] - 48)} ${f(q[1])} ${f(q[0] - 10)} ${f(q[1])}`;
  let web = "", path = "";
  const packets: P[] = [];
  for (let l = 0; l < 4; l++)
    for (let a = 0; a < layers[l]; a++)
      for (let b = 0; b < layers[l + 1]; b++) {
        const p = nodes[l][a], q = nodes[l + 1][b];
        if (a === hot[l] && b === hot[l + 1]) {
          path += cv(p, q);
          packets.push([(p[0] + q[0]) / 2, (p[1] + q[1]) / 2]);
        } else web += cv(p, q);
      }
  const ins = nodes[0].map(([x, y]) => `M92 ${y}H${x - 14}M92 ${y - 3}v6`).join("");
  const outs = nodes[4].map(([x, y]) => `M${x + 14} ${y}H548m-5 -4l5 4-5 4`).join("");
  const act = nodes[2][2];

  return (
    <g>
      <path d={X.map((x) => `M${x} 70V296`).join("")} {...dim(0.12)} strokeDasharray="1 5" />
      <path d={web} {...dim(0.16)} />
      <path d={path} {...S} strokeWidth={1.5} strokeOpacity={0.9} />
      <path d={ins} {...dim(0.45)} />
      <path d={outs} {...S} strokeOpacity={0.7} />
      {packets.map((p, i) => (
        <circle key={i} cx={f(p[0])} cy={f(p[1])} r={2.5} {...S} strokeWidth={1} {...tint(0.12)} />
      ))}
      {nodes.flatMap((layer, l) =>
        layer.map((p, k) => (
          <g key={`${l}-${k}`}>
            <circle cx={p[0]} cy={p[1]} r={10} {...S} strokeOpacity={hot[l] === k ? 0.95 : 0.55} {...tint(hot[l] === k ? 0.12 : 0.05)} />
            <circle cx={p[0]} cy={p[1]} r={3} {...dim(0.4)} />
          </g>
        )),
      )}
      <circle cx={act[0]} cy={act[1]} r={26} {...dim(0.3)} strokeDasharray="2 5" />
      <circle className="schem-pulse" cx={act[0]} cy={act[1]} r={17} {...S} />
      <circle cx={act[0]} cy={act[1]} r={5} {...ACCENT} />
      <Label x={128} y={318} anchor="middle">IN</Label>
      <Label x={320} y={318} anchor="middle">ATTN</Label>
      <Label x={512} y={318} anchor="middle">OUT</Label>
    </g>
  );
}

/* ---------- wireframe: browser + page blocks + code bracket ---------- */

function Wireframe() {
  const cols = Array.from({ length: 13 }, (_, i) => `M${f(112 + i * 29)} 88V296`).join("");
  const handles = [[292, 108], [460, 108], [292, 220], [460, 220]].map(([x, y]) => `M${x - 2.5} ${y - 2.5}h5v5h-5Z`).join("");

  return (
    <g>
      <path d="M96 46H256M316 46H476M96 42V50M476 42V50" {...dim(0.4)} />
      <Label x={286} y={49.5} anchor="middle">1440 PX</Label>
      <rect x={96} y={58} width={380} height={244} rx={6} {...S} strokeOpacity={0.9} {...tint(0.04)} />
      <path d="M96 80H476" {...dim(0.4)} />
      {[108, 120, 132].map((x) => <circle key={x} cx={x} cy={69} r={3} {...dim(0.5)} />)}
      <rect x={150} y={63} width={200} height={12} rx={6} {...dim(0.35)} />
      <path d={cols} {...dim(0.08)} />
      <rect x={112} y={90} width={22} height={10} rx={2} {...dim(0.6)} />
      <path d="M352 95h18M380 95h18M408 95h18M436 95h18" {...dim(0.45)} />
      <rect x={112} y={120} width={170} height={12} rx={2} {...S} strokeOpacity={0.8} {...tint(0.1)} />
      <rect x={112} y={138} width={130} height={12} rx={2} {...S} strokeOpacity={0.8} {...tint(0.1)} />
      <path d="M112 164H272M112 174H262M112 184H222" {...dim(0.35)} />
      <rect x={112} y={198} width={64} height={18} rx={9} {...ACCENT} />
      <rect x={184} y={198} width={56} height={18} rx={9} {...S} strokeOpacity={0.6} />
      <rect x={296} y={112} width={160} height={104} rx={3} {...dim(0.5)} {...tint(0.04)} />
      <path d="M296 112L456 216M456 112L296 216" {...dim(0.1)} />
      <path d="M306 206L346 160L372 186L398 150L446 206" {...S} strokeOpacity={0.6} />
      <circle cx={420} cy={134} r={8} {...dim(0.45)} />
      <rect x={292} y={108} width={168} height={112} {...dim(0.45)} strokeDasharray="3 3" />
      <path className="schem-pulse" d={handles} {...S} {...tint(0.12)} />
      {[112, 226, 340].map((x) => (
        <g key={x}>
          <rect x={x} y={232} width={100} height={56} rx={4} {...dim(0.45)} {...tint(0.05)} />
          <circle cx={x + 16} cy={248} r={6} {...dim(0.6)} />
          <path d={`M${x + 10} 266H${x + 80}M${x + 10} 276H${x + 62}`} {...dim(0.35)} />
        </g>
      ))}
      <rect x={452} y={222} width={108} height={72} rx={6} {...S} {...tint(0.08)} />
      <path d="M474 236L466 245L474 254M484 256L494 234M504 236L512 245L504 254" {...S} strokeWidth={1.5} />
      <path d="M466 272H530M466 282H510" {...dim(0.4)} />
      <path d="M476 240H452" {...dim(0.3)} strokeDasharray="2 3" />
    </g>
  );
}

/* ---------- dashboard: bars + donut + table ---------- */

function Dashboard() {
  const hs = [44, 70, 58, 88, 80, 106, 96, 122, 112];
  const bx = (i: number) => 120 + i * 22;
  const tops: P[] = hs.map((h, i) => [bx(i) + 6, 200 - h]);
  const cx = 444, cy = 140, R = 56, r = 38;
  const pa = (rr: number, t: number): P => [cx + rr * Math.cos(t), cy + rr * Math.sin(t)];
  let acc = -Math.PI / 2;
  const segs = [0.42, 0.26, 0.18, 0.14].map((p) => {
    const a0 = acc + 0.035;
    acc += p * 2 * Math.PI;
    const a1 = acc - 0.035, lg = a1 - a0 > Math.PI ? 1 : 0;
    const d = `M${xy(pa(R, a0))}A${R} ${R} 0 ${lg} 1 ${xy(pa(R, a1))}L${xy(pa(r, a1))}A${r} ${r} 0 ${lg} 0 ${xy(pa(r, a0))}Z`;
    return { d, mid: (a0 + a1) / 2 };
  });
  const call = pa(R + 4, segs[0].mid);
  const spark = (y: number, k: number) =>
    poly(Array.from({ length: 9 }, (_, i) => [440 + i * 10, y + 4 * Math.sin(i * (0.9 + k * 0.4) + k)] as P));

  return (
    <g>
      <rect x={96} y={64} width={236} height={152} rx={4} {...dim(0.3)} />
      <rect x={344} y={64} width={200} height={152} rx={4} {...dim(0.3)} />
      <rect x={96} y={226} width={448} height={72} rx={4} {...dim(0.3)} {...tint(0.03)} />
      <path d="M112 120H320M112 160H320" {...dim(0.1)} strokeDasharray="2 5" />
      <path d="M112 200H320" {...dim(0.45)} />
      {hs.map((h, i) => (
        <rect key={i} className={i === hs.length - 1 ? "schem-pulse" : undefined} x={bx(i)} y={200 - h} width={12} height={h} rx={1.5} {...S} strokeOpacity={0.75} {...tint(0.1)} />
      ))}
      <path d={poly(tops)} {...dim(0.4)} strokeDasharray="2 4" />
      <circle cx={cx} cy={cy} r={R + 8} {...dim(0.15)} strokeDasharray="1 4" />
      {segs.map((s, i) =>
        i === 0 ? <path key={i} d={s.d} {...ACCENT} /> : <path key={i} d={s.d} {...S} strokeOpacity={0.7} {...tint(0.08)} />,
      )}
      <path d={`M${xy(call)}L${f(call[0] + 12)} ${f(call[1] - 12)}H536`} {...dim(0.45)} />
      <Label x={cx} y={cy + 4} anchor="middle">42%</Label>
      <path d="M112 238h40M200 238h60M330 238h36" {...dim(0.55)} />
      <path d="M104 246H536" {...dim(0.35)} />
      <path d="M104 265H536M104 279H536" {...dim(0.12)} />
      {[258, 272, 286].map((y, k) => (
        <g key={y}>
          <circle cx={112} cy={y} r={2.5} {...S} strokeOpacity={k === 0 ? 0.9 : 0.45} />
          <path d={`M122 ${y}h${[64, 48, 58][k]}`} {...dim(0.6)} />
          <path d={`M200 ${y}h${[90, 70, 104][k]}`} {...dim(0.35)} />
          <path d={`M366 ${y}h-${[36, 28, 32][k]}`} {...dim(0.5)} />
          <path d={spark(y, k)} {...dim(0.55)} />
        </g>
      ))}
      <Label x={536} y={241} anchor="end">n = 1,284</Label>
    </g>
  );
}

/* ---------- terminal: prompt + tree output + flame graph ---------- */

function Terminal() {
  // [row, start, width, onHotPath] as fractions of the flame graph width
  const flame: [number, number, number, number][] = [
    [0, 0, 1, 1], [1, 0, 0.62, 1], [1, 0.64, 0.36, 0], [2, 0, 0.34, 0], [2, 0.36, 0.26, 1], [2, 0.64, 0.22, 0],
    [3, 0.02, 0.2, 0], [3, 0.36, 0.18, 1], [3, 0.66, 0.12, 0], [4, 0.04, 0.1, 0], [4, 0.38, 0.1, 1], [5, 0.39, 0.06, 1],
  ];
  const ruler = Array.from({ length: 11 }, (_, i) => `M${f(392 + i * 16.4)} 154v${i % 5 ? 3 : 6}`).join("");

  return (
    <g>
      <rect x={92} y={62} width={280} height={236} rx={6} {...S} strokeOpacity={0.9} {...tint(0.05)} />
      <path d="M92 84H372" {...dim(0.4)} />
      {[106, 118, 130].map((x) => <circle key={x} cx={x} cy={73} r={3} {...dim(0.5)} />)}
      <Label x={232} y={77} anchor="middle">~/bin</Label>
      <path d="M104 102l5 4-5 4M118 106H232M104 234l5 4-5 4M118 238H194" {...S} strokeOpacity={0.9} />
      <path d="M104 124H292" {...dim(0.35)} />
      <rect x={104} y={138} width={6} height={6} {...S} strokeWidth={1} strokeOpacity={0.6} />
      <path d="M107 148V214H118M107 160H118M130 166V196H140M130 178H140" {...dim(0.4)} />
      <path d="M118 142H170M124 160H196M146 178H212M146 196H188M124 214H176" {...dim(0.6)} />
      <rect className="schem-pulse" x={200} y={231} width={8} height={14} rx={1} {...ACCENT} />
      <path d="M92 276H372" {...dim(0.2)} />
      <path d="M104 287H140M150 287H176M330 287H360" {...dim(0.35)} />
      <path d="M372 124H382V154H390" {...dim(0.3)} strokeDasharray="2 3" />
      <path d={`M392 154H556${ruler}`} {...dim(0.35)} />
      {flame.map(([row, s, w, hot], i) => (
        <rect key={i} x={f(392 + s * 164)} y={298 - (row + 1) * 22 + 2} width={f(w * 164 - 2)} height={20} rx={2}
          {...S} strokeWidth={1} strokeOpacity={hot ? 0.9 : 0.4} {...tint(0.04 + row * 0.012)} />
      ))}
      <Label x={556} y={146} anchor="end">12 MS</Label>
    </g>
  );
}

/* ---------- globe: tilted graticule + hotspot ---------- */

function Globe() {
  const cx = 320, cy = 170, R = 112, tl = 0.38, spin = -20 * D;
  const p3 = (x0: number, y0: number, z0: number): P3 => ({
    x: cx + R * x0,
    y: cy - R * (y0 * Math.cos(tl) - z0 * Math.sin(tl)),
    z: z0 * Math.cos(tl) + y0 * Math.sin(tl),
  });
  const ll = (lat: number, lon: number) => {
    const a = lat * D, o = lon * D + spin;
    return p3(Math.cos(a) * Math.sin(o), Math.sin(a), Math.cos(a) * Math.cos(o));
  };
  // split a projected polyline into front-facing and back-facing runs
  const split = (ps: P3[]) => {
    const out = { front: "", back: "" };
    let prev = "";
    for (let i = 1; i < ps.length; i++) {
      const a = ps[i - 1], b = ps[i], k = a.z + b.z >= 0 ? "front" : "back";
      out[k] += (k === prev ? "" : `M${f(a.x)} ${f(a.y)}`) + `L${f(b.x)} ${f(b.y)}`;
      prev = k;
    }
    return out;
  };
  const steps = Array.from({ length: 61 }, (_, i) => i * 6);
  let front = "", back = "";
  const add = (ps: P3[]) => {
    const s = split(ps);
    front += s.front;
    back += s.back;
  };
  for (let lon = 0; lon < 180; lon += 30) add(steps.map((t) => ll(t, lon)));
  for (const lat of [-60, -30, 30, 60]) add(steps.map((t) => ll(lat, t)));
  const eq = split(steps.map((t) => ll(0, t)));
  const hs = ll(24, 38);
  const ring = (r: number) =>
    poly(steps.map((t) => {
      const q = ll(24 + r * Math.sin(t * D), 38 + (r * Math.cos(t * D)) / Math.cos(24 * D));
      return [q.x, q.y] as P;
    }), true);

  return (
    <g>
      <ellipse cx={320} cy={316} rx={96} ry={9} {...dim(0.35)} />
      <ellipse cx={320} cy={316} rx={60} ry={5.5} {...dim(0.2)} {...tint(0.06)} />
      <path d="M224 316L210 196M416 316L430 196" {...dim(0.12)} />
      <path d={back} {...dim(0.12)} />
      <path d={eq.back} {...dim(0.15)} />
      <circle cx={cx} cy={cy} r={R} {...S} strokeOpacity={0.9} {...tint(0.04)} />
      <path d={front} {...dim(0.42)} />
      <path d={eq.front} {...S} strokeOpacity={0.7} />
      <ellipse cx={cx} cy={cy} rx={158} ry={36} transform={`rotate(-12 ${cx} ${cy})`} {...dim(0.3)} strokeDasharray="3 6" />
      <path d={ring(10)} {...dim(0.3)} {...tint(0.05)} />
      <path d={ring(5)} {...dim(0.55)} />
      <circle className="schem-pulse" cx={f(hs.x)} cy={f(hs.y)} r={9} {...S} />
      <circle cx={f(hs.x)} cy={f(hs.y)} r={3.5} {...ACCENT} />
      <path d={`M${f(hs.x + 7)} ${f(hs.y - 7)}L${f(hs.x + 7 + (hs.y - 77))} 70H556`} {...dim(0.5)} />
      <Label x={452} y={64}>N 24.0 E 38.0</Label>
      <Label x={452} y={84}>ΔT +1.3</Label>
    </g>
  );
}

/* ---------- converter: file -> transform -> file ---------- */

function Converter() {
  const file = (x: number) => `M${x} 80H${x + 82}L${x + 104} 102V224H${x}Z`;
  const fold = (x: number) => `M${x + 82} 80V102H${x + 104}`;
  const text = [72, 60, 80, 40, 76, 56, 70, 34].map((w, i) => `M146 ${118 + i * 12}h${w}`).join("");
  const rowsT = [124, 140, 156, 172, 188].map((y) => `M418 ${y}h76`).join("");
  const at = (r: number, deg: number): P => [320 + r * Math.cos(deg * D), 152 + r * Math.sin(deg * D)];
  const head = (deg: number) => {
    const tip = at(14, deg), t = deg * D, c = Math.cos(t), s = Math.sin(t);
    const bk: P = [tip[0] + 4 * s, tip[1] - 4 * c];
    return poly([[bk[0] + 3 * c, bk[1] + 3 * s], tip, [bk[0] - 3 * c, bk[1] - 3 * s]]);
  };
  const cycle =
    `M${xy(at(14, 200))}A14 14 0 0 1 ${xy(at(14, 340))}M${xy(at(14, 20))}A14 14 0 0 1 ${xy(at(14, 160))}` + head(340) + head(160);
  const ticks = Array.from({ length: 9 }, (_, i) => `M${132 + i * 47} 279v10`).join("");
  const chips = (x: number, label: string) => (
    <g>
      <rect x={x} y={238} width={48} height={16} rx={8} {...S} strokeOpacity={0.8} {...tint(0.1)} />
      <rect x={x + 54} y={238} width={26} height={16} rx={8} {...dim(0.3)} />
      <rect x={x + 86} y={238} width={18} height={16} rx={8} {...dim(0.2)} />
      <Label x={x + 24} y={249.5} anchor="middle">{label}</Label>
    </g>
  );

  return (
    <g>
      <path d={file(132)} {...S} strokeOpacity={0.9} {...tint(0.05)} />
      <path d={fold(132)} {...dim(0.5)} />
      <path d="M146 100h40" {...S} strokeOpacity={0.8} />
      <path d={text} {...dim(0.38)} />
      <path d={file(404)} {...S} strokeOpacity={0.9} {...tint(0.05)} />
      <path d={fold(404)} {...dim(0.5)} />
      <rect x={418} y={108} width={76} height={16} {...tint(0.1)} />
      <rect x={418} y={108} width={76} height={96} {...dim(0.5)} />
      <path d={`${rowsT}M443.3 108v96M468.7 108v96`} {...dim(0.2)} />
      <circle cx={320} cy={152} r={36} {...dim(0.18)} />
      <circle className="schem-pulse" cx={320} cy={152} r={28} {...S} strokeDasharray="2 5" />
      <path d={cycle} {...S} strokeOpacity={0.85} />
      <path d="M248 152H284" {...dim(0.6, 1.25)} strokeDasharray="3 4" />
      <path d="M356 152H390" {...S} strokeOpacity={0.9} />
      <path d="M390 146L400 152L390 158Z" {...ACCENT} />
      {chips(132, "SRC")}
      {chips(404, "OUT")}
      <path d={`M132 284H508${ticks}`} {...dim(0.22)} />
      <rect x={132} y={281} width={256} height={6} rx={3} {...S} strokeOpacity={0.6} {...tint(0.12)} />
      <Label x={508} y={274} anchor="end">68%</Label>
    </g>
  );
}

/* ---------- game: low-poly terrain + waypoint ---------- */

function Game({ uid }: BodyProps) {
  const hz = 196;
  const ridge: P[] = [
    [84, 196], [122, 168], [150, 178], [188, 132], [226, 160], [262, 146], [300, 104],
    [338, 150], [372, 138], [410, 166], [446, 120], [486, 158], [520, 142], [556, 196],
  ];
  const base: P[] = ridge.slice(0, -1).map(([x], i) => [(x + ridge[i + 1][0]) / 2, hz]);
  const facets = ridge.slice(1, -1).map((r, i) => poly([base[i], r, base[i + 1]])).join("");
  const far = poly(Array.from({ length: 17 }, (_, i) =>
    [72 + i * 31, 186 - 30 * Math.abs(Math.sin(i * 1.3)) - 12 * Math.abs(Math.sin(i * 2.9))] as P));
  let ground = "";
  for (let k = 1; k <= 6; k++) ground += `M72 ${f(hz + 110 * (k / 6) ** 2)}H568`;
  for (let i = -7; i <= 7; i++) ground += `M${320 + i * 14} ${hz}L${320 + i * 110} 306`;

  return (
    <g>
      <defs>
        <clipPath id={`clip-game-${uid}`}>
          <rect x={72} y={hz} width={496} height={112} />
        </clipPath>
      </defs>
      <path d="M96 104Q330 18 560 76" {...dim(0.35)} />
      <path d="M96 111Q330 27 560 83" {...dim(0.18)} />
      <path d={far} {...dim(0.2)} />
      <path d={poly(ridge, true)} {...S} strokeOpacity={0.9} {...tint(0.06)} />
      <path d={facets} {...dim(0.3)} />
      <g clipPath={`url(#clip-game-${uid})`}>
        <path d={ground} {...dim(0.2)} />
      </g>
      <path d={`M72 ${hz}H568`} {...S} strokeOpacity={0.7} />
      <path d="M320 188v-5M320 204v5" {...dim(0.4)} />
      <ellipse cx={404} cy={270} rx={30} ry={7} {...dim(0.3)} strokeDasharray="2 4" />
      <ellipse className="schem-pulse" cx={404} cy={270} rx={16} ry={4.5} {...S} {...tint(0.1)} />
      <path d="M404 244V266" {...dim(0.55)} strokeDasharray="2 3" />
      <path d="M386 216v-6h6M422 216v-6h-6" {...dim(0.5)} />
      <path d="M392 222H416L404 240Z" {...ACCENT} />
      <Label x={424} y={228}>WP 03</Label>
      <Label x={424} y={242}>412 M</Label>
    </g>
  );
}

/* ---------- mobile: phone frame + radial chart ---------- */

function Mobile({ uid }: BodyProps) {
  const cx = 320, cy = 140;
  const at = (r: number, deg: number): P => [cx + r * Math.cos(deg * D), cy + r * Math.sin(deg * D)];
  const ring = (n: number, step: number, r0: number, r1: (i: number) => number) =>
    Array.from({ length: n }, (_, i) => poly([at(r0, i * step), at(r1(i), i * step)])).join("");
  const planets = [20, 95, 140, 210, 262, 322].map((a) => at(22, a));
  const chords = [[0, 2], [1, 4], [2, 5], [3, 0], [4, 5]].map(([i, j]) => poly([planets[i], planets[j]])).join("");
  const wedge = `M${xy(at(44, -90))}A44 44 0 0 1 ${xy(at(44, -60))}L${xy(at(30, -60))}A30 30 0 0 0 ${xy(at(30, -90))}Z`;
  const lc = at(98, 200), rc = at(120, -35);

  return (
    <g>
      <defs>
        <mask id={`mask-mobile-${uid}`} maskUnits="userSpaceOnUse" x={0} y={0} width={640} height={360}>
          <rect width={640} height={360} fill="white" />
          <rect x={252} y={39} width={136} height={282} rx={22} fill="black" />
        </mask>
      </defs>
      <g mask={`url(#mask-mobile-${uid})`}>
        <circle cx={cx} cy={cy} r={98} {...dim(0.3)} strokeDasharray="2 6" />
        <circle cx={cx} cy={cy} r={120} {...dim(0.15)} />
        <path d={ring(24, 15, 98, (i) => (i % 2 ? 102 : 106))} {...dim(0.3)} />
      </g>
      <path d={`M${xy(lc)}H150`} {...dim(0.45)} />
      <path d={`M${xy(rc)}L${f(rc[0] + 18)} ${f(rc[1] - 18)}H520`} {...dim(0.45)} />
      <path d="M386 45H548M386 315H548M540 45V315M536 45h8M536 315h8" {...dim(0.2)} />
      <rect x={258} y={45} width={124} height={270} rx={18} {...S} strokeOpacity={0.9} {...tint(0.04)} />
      <rect x={264} y={51} width={112} height={258} rx={13} {...dim(0.3)} />
      <rect x={302} y={56} width={36} height={9} rx={4.5} {...S} strokeOpacity={0.6} {...tint(0.1)} />
      <path d="M272 61h14" {...dim(0.4)} />
      <rect x={354} y={57} width={14} height={7} rx={2} {...dim(0.4)} />
      <path d={ring(72, 5, 44, (i) => (i % 6 ? 47 : 50))} {...dim(0.4)} />
      <circle cx={cx} cy={cy} r={44} {...S} strokeOpacity={0.9} />
      <circle cx={cx} cy={cy} r={30} {...S} strokeOpacity={0.6} {...tint(0.05)} />
      <circle cx={cx} cy={cy} r={10} {...dim(0.3)} />
      <path d={ring(12, 30, 30, () => 44)} {...dim(0.45)} />
      <path d={wedge} {...ACCENT} fillOpacity={0.75} />
      <path d={chords} {...dim(0.35)} />
      {planets.map((p, i) => (
        <circle key={i} cx={f(p[0])} cy={f(p[1])} r={2.5} {...S} strokeWidth={1} {...tint(0.12)} />
      ))}
      <circle className="schem-pulse" cx={f(planets[1][0])} cy={f(planets[1][1])} r={6} {...S} />
      {[206, 228, 250].map((y, k) => (
        <g key={y}>
          <circle cx={278} cy={y} r={5} {...dim(k === 0 ? 0.7 : 0.4)} />
          <path d={`M290 ${y - 3}H${[352, 340, 346][k]}`} {...dim(0.55)} />
          <path d={`M290 ${y + 4}H${[330, 322, 334][k]}`} {...dim(0.25)} />
        </g>
      ))}
      <path d="M264 280H376" {...dim(0.2)} />
      {[283, 308, 333, 358].map((x, i) => (
        <rect key={x} x={x - 4} y={288} width={8} height={8} rx={2} {...dim(i === 0 ? 0.8 : 0.35)} />
      ))}
      <path d="M300 305H340" {...S} strokeWidth={1.5} strokeOpacity={0.5} />
      <Label x={150} y={100}>ASC 14°</Label>
      <Label x={520} y={f(rc[1] - 24)} anchor="end">12 / 30°</Label>
    </g>
  );
}

/* ---------- transit: octilinear route map ---------- */

function Transit({ uid }: BodyProps) {
  const A: P[] = [[96, 250], [170, 250], [240, 180], [440, 180], [500, 120], [548, 120]];
  const B: P[] = [[200, 70], [280, 70], [340, 130], [340, 240], [390, 290], [520, 290]];
  const C: P[] = [[120, 120], [200, 120], [300, 220], [460, 220], [500, 260], [548, 260]];
  const hubs: P[] = [[260, 180], [340, 180], [340, 220]];
  const bar = (p: P, q: P, t: number, half: number) => {
    const L = Math.hypot(q[0] - p[0], q[1] - p[1]), nx = -(q[1] - p[1]) / L, ny = (q[0] - p[0]) / L;
    const c: P = [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
    return poly([[c[0] - nx * half, c[1] - ny * half], [c[0] + nx * half, c[1] + ny * half]]);
  };
  // station ticks every `step` px along the line, skipping hubs and termini
  const stations = (ps: P[], step: number) => {
    let d = "", acc = 0, next = step / 2;
    const avoid = [...hubs, ps[0], ps[ps.length - 1]];
    for (let i = 0; i < ps.length - 1; i++) {
      const p = ps[i], q = ps[i + 1], L = Math.hypot(q[0] - p[0], q[1] - p[1]);
      for (; next <= acc + L; next += step) {
        const t = (next - acc) / L, x = p[0] + (q[0] - p[0]) * t, y = p[1] + (q[1] - p[1]) * t;
        if (!avoid.some(([hx, hy]) => Math.hypot(x - hx, y - hy) < 20)) d += bar(p, q, t, 4);
      }
      acc += L;
    }
    return d + bar(ps[0], ps[1], 0, 7) + bar(ps[ps.length - 2], ps[ps.length - 1], 1, 7);
  };
  const river = "M96 306C170 290 226 318 292 302S420 256 548 236";

  return (
    <g>
      <defs>
        <mask id={`mask-transit-${uid}`} maskUnits="userSpaceOnUse" x={0} y={0} width={640} height={360}>
          <rect width={640} height={360} fill="white" />
          <rect x={335} y={175} width={10} height={50} rx={5} fill="black" />
          <circle cx={260} cy={180} r={5} fill="black" />
        </mask>
      </defs>
      <path d={river} {...dim(0.15)} />
      <path d={river} {...dim(0.15)} transform="translate(0 7)" />
      <g mask={`url(#mask-transit-${uid})`}>
        <path d={poly(C)} {...S} strokeOpacity={0.45} strokeDasharray="6 4" />
        <path d={poly(B)} {...S} strokeWidth={1.5} strokeOpacity={0.6} />
        <path d={poly(A)} {...S} strokeWidth={1.5} strokeOpacity={0.95} />
        <path d={stations(A, 46) + stations(B, 46) + stations(C, 46)} {...S} strokeWidth={1} strokeOpacity={0.7} />
      </g>
      <rect className="schem-pulse" x={328} y={168} width={24} height={64} rx={12} {...S} strokeOpacity={0.5} />
      <rect x={333} y={173} width={14} height={54} rx={7} {...S} {...tint(0.1)} />
      <circle cx={260} cy={180} r={7} {...S} {...tint(0.1)} />
      <rect x={284} y={176} width={22} height={8} rx={4} {...ACCENT} />
      <circle cx={560} cy={70} r={12} {...dim(0.3)} />
      <path d="M560 60L564 72L560 69L556 72Z" {...S} strokeWidth={1} {...tint(0.12)} />
      <Label x={560} y={52} anchor="middle">N</Label>
      <Label x={96} y={236}>L1</Label>
      <Label x={200} y={56} anchor="middle">L2</Label>
    </g>
  );
}

/* ---------- entry ---------- */

type BodyProps = { uid: string };

const BODIES: Record<SchematicKind, (props: BodyProps) => ReactElement> = {
  chess: Chess, candles: Candles, neural: Neural, wireframe: Wireframe, dashboard: Dashboard, terminal: Terminal,
  globe: Globe, converter: Converter, game: Game, mobile: Mobile, transit: Transit,
};

const ARIA: Record<SchematicKind, string> = {
  chess: "chess board with a move search tree",
  candles: "candlestick chart with an equity curve",
  neural: "layered node graph with an active node",
  wireframe: "browser page wireframe with a code bracket",
  dashboard: "data dashboard with bar chart, donut and table",
  terminal: "terminal window with a flame graph",
  globe: "wireframe globe with a hotspot",
  converter: "file conversion between two formats",
  game: "low-poly terrain with a waypoint",
  mobile: "phone with a radial chart",
  transit: "transit route map with stations",
};

export default function Schematic({
  kind,
  className,
  uid = "s",
}: {
  kind: SchematicKind;
  className?: string;
  /** Unique per instance so SVG pattern/mask ids never collide on one page. */
  uid?: string;
}) {
  const Body = BODIES[kind];
  return (
    <svg viewBox="0 0 640 360" className={className} role="img" aria-label={`Holographic schematic: ${ARIA[kind]}`}
      preserveAspectRatio="xMidYMid meet" fill="none" xmlns="http://www.w3.org/2000/svg">
      <Frame kind={kind} uid={uid} />
      <Body uid={uid} />
    </svg>
  );
}
