"use client";

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';


const translations = [
  "In your language.",
  "En su idioma.",
  "بلغتك.",
  "Katika lugha yako.",
  "用您的语言.",
  "Bằng ngôn ngữ của bạn.",
  "आपकी भाषा में.",
  "آپ کی زبان میں.",
  "Sa iyong wika."
];

export default function LandingPage() {
  const [index, setIndex] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % translations.length);
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col font-sans text-slate-900">
      
      <header className="w-full px-8 py-5 bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-100 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Image alt="Ahani Logo" className="rounded-full" height={40} src="/image_4fbdd3.png" width={40} />
          <span className="text-2xl font-bold tracking-tight text-slate-800">Ahani</span>
        </div>
        <nav className="hidden md:flex gap-6 items-center font-medium text-sm lg:text-base">
          <Link className="text-slate-500 hover:text-slate-900 transition" href="/about">Our Mission</Link>
          <Link className="text-slate-500 hover:text-slate-900 transition" href="/agencies">Empower Communities</Link>
          <Link className="text-slate-500 hover:text-slate-900 transition" href="/how-it-works">How it Works</Link>
          <Link className="text-slate-900 font-bold hover:text-slate-600 transition" href="/subscribe">Subscribe</Link>
          <Link className="bg-slate-900 text-white px-5 py-2 rounded-lg hover:bg-slate-800 transition shadow-sm" href="/contact">
            Contact
          </Link>
        </nav>
      </header>

      <main className="flex-grow flex flex-col items-center justify-center text-center px-6 pt-20 pb-24 max-w-5xl mx-auto">
        <div className="inline-block mb-4 px-4 py-1.5 rounded-full bg-purple-50 border border-purple-100 text-purple-700 text-sm font-semibold tracking-wide">
          Bridging language. Building trust.
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-tight min-h-[140px] md:min-h-[160px]">
          Understand your mail. <br />
          <span className="bg-gradient-to-r from-[#b37ebd] via-[#9bbca7] to-[#e8c17a] text-transparent bg-clip-text transition-all duration-300">
            {mounted ? translations[index] : "In your language."}
          </span>
        </h1>
        
        <p className="text-xl md:text-2xl text-slate-500 max-w-3xl mx-auto mb-12 leading-relaxed">
          Ahani transforms any confusing letter, bill, or formal notice into plain text and spoken audio in your language. Listen to clear explanations and ask follow-up questions so you never have to guess.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <button className="bg-slate-900 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-slate-800 transition shadow-lg flex items-center justify-center gap-2">
            Download the App
          </button>
          
          <Link className="bg-white text-slate-900 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-slate-50 transition border border-slate-200 shadow-sm flex items-center justify-center gap-2" href="/login">
            Enterprise Solutions
          </Link>
        </div>
      </main>

      <footer className="w-full bg-slate-900 text-white py-6 px-8 border-t border-slate-800">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <Image alt="Ahani Logo" className="rounded-full" height={24} src="/image_4fbdd3.png" width={24} />
            <span className="text-lg font-bold tracking-tight">Ahani</span>
            <span className="text-slate-500 text-sm hidden sm:inline-block ml-2">| &copy; 2026 All rights reserved.</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-slate-400">
            <Link className="hover:text-white transition" href="/privacy">Privacy Policy</Link>
            <Link className="hover:text-white transition" href="/terms">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}