// Halo's motion tracker: a sweeping radar with friendly contacts.
// Blip delays are synced to the sweep so each one pings as the beam passes.
const SWEEP_SECONDS = 3.2;

const contacts = [
  { angle: 38, radius: 0.55 },
  { angle: 152, radius: 0.72 },
  { angle: 250, radius: 0.38 },
  { angle: 318, radius: 0.8 },
];

export default function MotionTracker({ className = "" }: { className?: string }) {
  return (
    <div className={`relative ${className}`} aria-hidden="true">
      <div className="relative aspect-square w-full overflow-hidden rounded-full border border-holo/40 bg-void/55 backdrop-blur-sm">
        {/* range rings */}
        <div className="absolute inset-0 rounded-full bg-[repeating-radial-gradient(circle,transparent_0_23%,rgba(92,214,255,0.22)_23%_calc(23%+1px))]" />
        {/* crosshair */}
        <div className="absolute inset-x-0 top-1/2 h-px bg-holo/20" />
        <div className="absolute inset-y-0 left-1/2 w-px bg-holo/20" />
        {/* sweep */}
        <div className="radar-sweep absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,transparent_0deg,transparent_280deg,rgba(92,214,255,0.45)_360deg)]" />
        {contacts.map((c) => {
          const rad = ((c.angle - 90) * Math.PI) / 180;
          const x = 50 + Math.cos(rad) * c.radius * 50;
          const y = 50 + Math.sin(rad) * c.radius * 50;
          return (
            <span
              key={c.angle}
              className="radar-blip absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-visor shadow-[0_0_10px_rgba(242,169,59,0.9)]"
              style={{
                left: `${x}%`,
                top: `${y}%`,
                animationDelay: `${(c.angle / 360) * SWEEP_SECONDS}s`,
              }}
            />
          );
        })}
        {/* player marker */}
        <svg viewBox="0 0 10 10" className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 text-holo">
          <path d="M5 0 10 10 5 7.5 0 10Z" fill="currentColor" />
        </svg>
      </div>
      <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-void px-1.5 font-hud text-xs tracking-widest text-holo/80">
        25m
      </span>
    </div>
  );
}
