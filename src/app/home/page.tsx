import type { Metadata } from "next";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Projects from "@/components/Projects";
import Experience from "@/components/Experience";
import Loadout from "@/components/Loadout";
import Firefight from "@/components/Firefight";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Amogh Shukla — Projects, experience and skills",
};

export default function Home() {
  return (
    <>
      <a
        href="#campaign"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-20 focus:z-[60] focus:bg-visor focus:px-4 focus:py-2 focus:text-void"
      >
        Skip to projects
      </a>
      <Header />
      <main>
        <Hero />
        <Projects />
        <Experience />
        <Loadout />
        <Firefight />
      </main>
      <Footer />
    </>
  );
}
