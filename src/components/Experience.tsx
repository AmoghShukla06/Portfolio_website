import SectionHeading from "@/components/SectionHeading";
import { Chevron } from "@/components/Icons";
import { serviceRecord } from "@/data/portfolio";

export default function Experience() {
  return (
    <section
      id="service-record"
      aria-labelledby="service-record-title"
      className="relative overflow-hidden py-24 md:py-32"
    >
      {/* holotable grid, fading out at the edges */}
      <div className="holo-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_30%_40%,black,transparent_70%)]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading
          id="service-record"
          title="Service record"
          lead="Where I've put these skills to work so far."
        />

        <ol className="space-y-8">
          {serviceRecord.map((post) => {
            const active = post.period.includes("present");
            return (
              <li key={post.unit} className="panel chamfer [--cut:22px]">
                <div className="brackets opacity-40" />
                <div className="grid gap-8 p-6 sm:p-10 md:grid-cols-[minmax(0,17rem)_minmax(0,1fr)] md:gap-14">
                  <div>
                    {active && (
                      <span className="mb-5 inline-flex items-center gap-2 border border-visor/50 bg-visor/10 px-2.5 py-1 font-hud text-sm tracking-wide text-visor">
                        <span className="radar-blip h-1.5 w-1.5 rounded-full bg-visor" style={{ animationDuration: "2.4s" }} />
                        Active duty
                      </span>
                    )}
                    <h3 className="font-display text-3xl text-ink sm:text-4xl">{post.unit}</h3>
                    <p className="mt-2 font-hud text-xl tracking-wide text-holo">{post.role}</p>
                    <dl className="mt-6 space-y-3 border-t border-line pt-5">
                      <div className="flex justify-between gap-4">
                        <dt className="font-hud text-sm text-muted">Tour</dt>
                        <dd className="text-[15px] text-ink/90">{post.period}</dd>
                      </div>
                      <div className="flex justify-between gap-4">
                        <dt className="font-hud text-sm text-muted">Type</dt>
                        <dd className="text-[15px] text-ink/90">{post.kind}</dd>
                      </div>
                    </dl>
                  </div>

                  <div>
                    <p className="max-w-[62ch] text-lg leading-8 text-ink/85">{post.summary}</p>
                    <h4 className="mt-8 font-hud text-sm tracking-[0.14em] text-muted">Commendations</h4>
                    <ul className="mt-4 space-y-4">
                      {post.commendations.map((c) => (
                        <li key={c} className="flex max-w-[62ch] gap-3 leading-7 text-ink/80">
                          <Chevron className="mt-2 h-3 w-3 shrink-0 text-holo" />
                          {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
