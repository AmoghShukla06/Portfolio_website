export default function MetallicBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-0 overflow-hidden">
      {/* Metallic shiny black base */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0c0c0e] via-[#17171b] to-[#050506]" />

      {/* Diagonal metallic sheen */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.04] to-transparent" />

      {/* Vignette to keep edges deep black */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(0,0,0,0.85))]" />
    </div>
  );
}
