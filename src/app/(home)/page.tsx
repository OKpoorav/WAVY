'use client'

import Image from "next/image"
import { useState } from "react"
import {  Menu, X } from "lucide-react"
import { ProjectForm } from "@/modules/projects/ui/home/ui/components/project-forms"
import { ProjectList } from "@/modules/projects/ui/home/ui/components/project-list"





function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-transparent py-6 px-6 md:px-12">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Image src="/logo.svg" alt="Wavy" width={50} height={50} />
            <span className="text-white font-bold text-xl tracking-tighter font-space">Wavy</span>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-gray-300 hover:text-white transition-colors duration-300 font-space">Features</a>
            <a href="#vision" className="text-gray-300 hover:text-white transition-colors duration-300 font-space">Vision</a>
            <a href="#press" className="text-gray-300 hover:text-white transition-colors duration-300 font-space">Press</a>
            <a href="#contact" className="text-gray-300 hover:text-white transition-colors duration-300 font-space">Contact</a>
          </div>

          <div className="md:hidden">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-white">
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden mt-4 bg-gray-900 bg-opacity-95 backdrop-blur-sm rounded-lg p-4 animate-fadeIn">
            <div className="flex flex-col space-y-4">
              <a href="#features" className="text-gray-300 hover:text-white transition-colors duration-300 py-2 font-space">Features</a>
              <a href="#vision" className="text-gray-300 hover:text-white transition-colors duration-300 py-2 font-space">Vision</a>
              <a href="#press" className="text-gray-300 hover:text-white transition-colors duration-300 py-2 font-space">Press</a>
              <a href="#contact" className="text-gray-300 hover:text-white transition-colors duration-300 py-2 font-space">Contact</a>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}




export default function Home() {
  return (
    <section className="relative min-h-screen flex flex-col items-center px-6 sm:px-8 md:px-12 overflow-hidden">
      <Image src="/bg.jpg" alt="Background" fill className="object-cover" priority />
      <div className="absolute inset-0 bg-black/40 z-10" />
      <Navbar />
      <div className="relative z-20 text-center w-full max-w-4xl mx-auto flex flex-col items-center justify-center min-h-screen py-8 sm:py-16 gap-y-6">
        <h1 className="w-full text-[rgb(255,140,0)] leading-tight tracking-tight mb-6 sm:mb-8 animate-fadeIn px-4">
          <span className="block font-inter font-medium text-[clamp(1.5rem,6vw,3.75rem)] whitespace-nowrap">Let Your Creativity Flow,</span>
          <span className="block font-instrument italic text-[clamp(1.5rem,6vw,3.75rem)] whitespace-nowrap">Ride the Waves.</span>
        </h1>
        <div className="mb-6 sm:mb-10 px-4">
          <p className="text-[clamp(1rem,3vw,1.5rem)] text-gray-400 leading-relaxed animate-fadeIn animation-delay-200 font-space">Build beautiful websites,</p>
          <p className="text-[clamp(1rem,3vw,1.5rem)] text-gray-400 leading-relaxed animate-fadeIn animation-delay-300 font-space">Without writing a single line of code.</p>
        </div>
        <ProjectForm />
      
      <ProjectList/>

      </div>
    </section>
    
  )
}