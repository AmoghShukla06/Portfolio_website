export default function SectionHeading({
  id,
  title,
  lead,
}: {
  id: string;
  title: string;
  lead: string;
}) {
  return (
    <div className="mb-12 md:mb-16">
      <div className="flex items-end gap-6">
        <h2
          id={`${id}-title`}
          className="font-display text-[clamp(2.5rem,6vw,4.5rem)] uppercase leading-none text-ink"
        >
          {title}
        </h2>
        {/* HUD hairline with a notch, running out to the edge */}
        <div className="relative mb-3 hidden h-px flex-1 bg-line sm:block">
          <span className="absolute -top-[3px] left-0 h-[7px] w-10 bg-holo/60 [clip-path:polygon(0_0,80%_0,100%_100%,20%_100%)]" />
        </div>
      </div>
      <p className="mt-4 max-w-2xl text-lg leading-8 text-muted">{lead}</p>
    </div>
  );
}
