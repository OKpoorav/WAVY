"use client";

import Image from "next/image";
import { ProjectForm } from "@/modules/projects/ui/home/ui/components/project-forms";

import { ProjectList } from "@/modules/projects/ui/home/ui/components/project-list";

export default function Home() {
  return (
    <section className="relative min-h-screen flex flex-col items-center px-6 sm:px-8 md:px-12 overflow-hidden">
      <Image
        src="/bg.jpg"
        alt="Background"
        fill
        className="object-cover"
        priority
      />
      <div className="absolute inset-0 bg-black/40 z-10" />
      <div className="relative z-20 text-center w-full max-w-4xl mx-auto flex flex-col items-center justify-center min-h-screen py-8 sm:py-16 gap-y-6">
        <h1 className="w-full text-[rgb(255,140,0)] leading-tight tracking-tight mb-6 sm:mb-8 animate-fadeIn px-4">
          <span className="block font-inter font-medium text-[clamp(1.5rem,6vw,3.75rem)] whitespace-nowrap">
            Let Your Creativity Flow,
          </span>
          <span className="block font-instrument italic text-[clamp(1.5rem,6vw,3.75rem)] whitespace-nowrap">
            Ride the Waves.
          </span>
        </h1>
        <div className="mb-6 sm:mb-10 px-4">
          <p className="text-[clamp(1rem,3vw,1.5rem)] text-gray-400 leading-relaxed animate-fadeIn animation-delay-200 font-space">
            Build beautiful websites,
          </p>
          <p className="text-[clamp(1rem,3vw,1.5rem)] text-gray-400 leading-relaxed animate-fadeIn animation-delay-300 font-space">
            Without writing a single line of code.
          </p>
        </div>
        <ProjectForm />

        <ProjectList />
      </div>
    </section>
  );
}
