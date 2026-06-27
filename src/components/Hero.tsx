"use client";

import { motion } from "framer-motion";
import GlassShards from "@/components/GlassShards";

export default function Hero() {
  return (
    <section className="relative h-screen w-full overflow-hidden">

      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: "url('/images/background.jpg')",
        }}
      />

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Falling glass shards */}
      <div className="absolute inset-0 z-[5]">
        <GlassShards />
      </div>

      {/* Hero Content */}
      <motion.div
        initial={{ opacity: 0, y: 80 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 1,
          ease: "easeOut",
        }}
        className="relative z-10 flex h-full items-center justify-center"
      >
        <div className="max-w-3xl px-6 text-center text-white sm:px-8">

          <h1 className="mb-6 text-4xl font-bold sm:text-6xl md:text-8xl">
            Hi, I&apos;m Amogh
          </h1>

          <p className="text-base leading-7 text-gray-300 sm:text-lg sm:leading-8 md:text-2xl">
            I am a Computer Science student passionate about Artificial
            Intelligence, Full Stack Development, Machine Learning and building
            impactful software. I enjoy solving complex problems and creating
            applications that combine elegant design with powerful technology.
          </p>

        </div>
      </motion.div>

    </section>
  );
}