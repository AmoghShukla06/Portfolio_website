import Link from "next/link";
import { handel } from "@/fonts/fonts";
export default function Landing() {
  return (
    <section className="relative h-screen w-screen overflow-hidden">

      {/* Background Video */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src="/videos/background_theme.webm" type="video/webm" />
      </video>

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/60"></div>

      {/* Content */}
      <div className="relative z-10 flex h-full flex-col items-center justify-center">
        <h1 className={`${handel.className} text-4xl sm:text-6xl md:text-7xl lg:text-8xl italic font-bold pt-6 pb-6 text-[#C0C0C0] text-center px-4`}>
          AMOGH SHUKLA
        </h1>

        <h2 className={`${handel.className} text-2xl sm:text-4xl md:text-5xl lg:text-6xl pb-6 text-[#C0C0C0] text-center px-4`}>
          Welcome to my Portfolio
        </h2>

        <Link
          href="/home"
            className="
                inline-flex items-center justify-center
                px-8 py-3 sm:px-12 sm:py-4
                rounded-sm
                border-2 border-gray-300/70
                bg-transparent
                text-base sm:text-xl font-bold uppercase tracking-[0.2em]
                text-gray-100
                transition-all duration-300
                hover:bg-gradient-to-r
                hover:from-'#1a1a1a'
                hover:via-cyan-900
                hover:to-black-500
                hover:border-cyan-300
                hover:text-grey
                hover:shadow-[0_0_20px_rgba(34,211,238,0.45)]
                hover:-translate-y-1
                active:translate-y-0
            "
            >JUMP IN
        </Link>
        <h3 className={`${handel.className} text-sm sm:text-lg md:text-2xl pt-4 pb-6 text-[#C0C0C0] text-center px-4`}>
          This Portfolio is inspired by the game series HALO
        </h3>
      </div>

    </section>
  );
}