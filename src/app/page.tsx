"use client";

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { Camera, Menu, X } from 'lucide-react';

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
  
  // Mobile Menu States
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  // Translation animation effect
  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % translations.length);
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  // Click outside to close mobile menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (isMobileMenuOpen && headerRef.current && !headerRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col font-sans text-slate-900">
      
      {/* Persistent Top Menu Bar */}
      <header ref={headerRef} className="w-full px-4 sm:px-8 py-4 sm:py-5 bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-100 flex justify-between items-center relative">
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition">
          <Image alt="Ahani Logo" className="rounded-full w-8 h-8 sm:w-10 sm:h-10" height={40} src="/image_4fbdd3.png" width={40} />
          <span className="text-xl sm:text-2xl font-bold tracking-tight text-slate-800">Ahani</span>
        </Link>
        
        {/* Desktop Navigation (Hidden on Mobile) */}
        <nav className="hidden md:flex gap-6 items-center font-medium text-sm lg:text-base">
          <Link className="text-slate-500 hover:text-slate-900 transition" href="/about">Our Mission</Link>
          <Link className="text-slate-500 hover:text-slate-900 transition" href="/agencies">Empower Communities</Link>
          <Link className="text-slate-500 hover:text-slate-900 transition" href="/how-it-works">How it Works</Link>
          <Link className="text-slate-900 font-bold hover:text-slate-600 transition" href="/login">Enterprise Login</Link>
          <Link className="bg-slate-900 text-white px-5 py-2 rounded-lg hover:bg-slate-800 transition shadow-sm" href="/contact">
            Contact
          </Link>
        </nav>

        {/* Mobile Hamburger Button */}
        <button 
          className="md:hidden p-2 text-slate-700 hover:text-slate-900 focus:outline-none"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>

        {/* Mobile Dropdown Menu */}
        {isMobileMenuOpen && (
          <div className="absolute top-full left-0 w-full bg-white border-b border-slate-200 shadow-xl flex flex-col md:hidden animate-in slide-in-from-top-2">
            <Link 
              href="/about" 
              className="px-6 py-4 border-b border-slate-50 text-slate-700 font-medium"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Our Mission
            </Link>
            <Link 
              href="/agencies" 
              className="px-6 py-4 border-b border-slate-50 text-slate-700 font-medium"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Empower Communities
            </Link>
            <Link 
              href="/how-it-works" 
              className="px-6 py-4 border-b border-slate-50 text-slate-700 font-medium"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              How it Works
            </Link>
            <Link 
              href="/login" 
              className="px-6 py-4 border-b border-slate-50 text-slate-900 font-bold"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Enterprise Login
            </Link>
            <div className="p-6">
              <Link 
                href="/contact" 
                className="block text-center bg-slate-900 text-white px-5 py-3 rounded-lg font-bold shadow-sm"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Contact
              </Link>
            </div>
          </div>
        )}
      </header>

      <main className="flex-grow flex flex-col items-center justify-center text-center px-6 pt-20 pb-24 max-w-5xl mx-auto">
        <div className="inline-block mb-4 px-4 py-1.5 rounded-full bg-purple-50 border border-purple-100 text-purple-700 text-sm font-semibold tracking-wide">
          Bridging language. Building trust.
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-tight">
          Understand your mail. <br />
          <span className="block h-[60px] md:h-[90px] mt-2 bg-gradient-to-r from-[#b37ebd] via-[#9bbca7] to-[#e8c17a] text-transparent bg-clip-text transition-all duration-300">
            {mounted ? translations[index] : "In your language."}
          </span>
        </h1>
        
        <p className="text-xl md:text-2xl text-slate-500 max-w-3xl mx-auto mb-12 leading-relaxed">
          Ahani transforms any confusing letter, bill, or formal notice into plain text and spoken audio in your language. Listen to clear explanations and ask follow-up questions so you never have to guess.
        </p>

        <div className="flex flex-col items-center gap-4 w-full sm:w-auto mt-4">
          <Link 
            href="/scan" 
            className="bg-purple-600 text-white px-10 py-5 rounded-2xl font-bold text-xl hover:bg-purple-700 hover:scale-[1.02] transition-all shadow-xl shadow-purple-200 flex items-center justify-center gap-3 w-full sm:w-auto"
          >
            <Camera size={24} />
            Start Scanning
          </Link>
          <p className="text-sm text-slate-500 font-medium">
            Free for agency mail • Pay-as-you-go for personal mail
          </p>
        </div>
      </main>

      {/* Persistent Footer */}
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