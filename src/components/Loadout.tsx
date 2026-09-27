import SectionHeading from "@/components/SectionHeading";
import { loadout } from "@/data/portfolio";

// Ammo-counter ticks: one per item in the slot, like Halo's magazine readout.
function Ammo({ count }: { count: number }) {
  return (
    <span className="flex gap-[3px]" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <span key={i} className="h-3 w-[3px] bg-holo/70" />
      ))}
    </span>
  );
}

export default function Loadout() {
  const [primary, ...rest] = loadout;

  return (
    <section id="loadout" aria-labelledby="loadout-title" className="relative py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading
          id="loadout"
          title="Loadout"
          lead="The languages, frameworks and tools I carry into a build."
        />

        <div className="grid gap-5 lg:grid-cols-12">
          {/* Primary weapon gets the big slot */}
          <div className="panel chamfer p-7 sm:p-9 lg:col-span-5 lg:row-span-3 [--cut:22px]">
            <div className="brackets opacity-40" />
            <div className="flex items-center justify-between">
              <span className="font-hud text-sm tracking-[0.14em] text-visor">{primary.slot}</span>
              <Ammo count={primary.items.length} />
            </div>
            <h3 className="mt-2 font-hud text-2xl font-medium tracking-wide text-muted">{primary.name}</h3>
            <ul className="mt-8 space-y-1">
              {primary.items.map((item) => (
                <li
                  key={item}
                  className="font-display text-[clamp(2rem,4vw,3.25rem)] leading-[1.15] text-ink"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {rest.map((slot) => (
            <div key={slot.slot} className="panel chamfer p-6 sm:p-7 lg:col-span-7 [--cut:14px]">
              <div className="flex items-center justify-between gap-4">
                <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                  <span className="font-hud text-sm tracking-[0.14em] text-holo">{slot.slot}</span>
                  <h3 className="font-hud text-xl font-medium tracking-wide text-ink">{slot.name}</h3>
                </div>
                <Ammo count={slot.items.length} />
              </div>
              <ul className="mt-5 flex flex-wrap gap-x-2 gap-y-2">
                {slot.items.map((item) => (
                  <li
                    key={item}
                    className="border border-line bg-holo/[0.05] px-3 py-1.5 font-hud text-[17px] tracking-wide text-ink/90"
                  >
                    {item}
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
