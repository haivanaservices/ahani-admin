import Image from 'next/image';
import Link from 'next/link';

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col font-sans text-slate-900">
      
      {/* Persistent Top Menu Bar */}
      <header className="w-full px-8 py-5 bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-100 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition">
          <Image alt="Ahani Logo" className="rounded-full" height={40} src="/image_4fbdd3.png" width={40} />
          <span className="text-2xl font-bold tracking-tight text-slate-800">Ahani</span>
        </Link>
        <nav className="hidden md:flex gap-6 items-center font-medium text-sm lg:text-base">
          <Link className="text-slate-500 hover:text-slate-900 transition" href="/about">Our Mission</Link>
          <Link className="text-slate-500 hover:text-slate-900 transition" href="/agencies">Empower Communities</Link>
          <Link className="text-slate-500 hover:text-slate-900 transition" href="/how-it-works">How it Works</Link>
          <Link className="text-slate-900 font-bold hover:text-slate-600 transition" href="/login">Enterprise Login</Link>
          <Link className="bg-slate-900 text-white px-5 py-2 rounded-lg hover:bg-slate-800 transition shadow-sm" href="/contact">
            Contact
          </Link>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-grow py-20 px-6">
        <div className="max-w-5xl mx-auto">
          
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6">How Ahani Works</h1>
            <p className="text-xl text-slate-500 max-w-2xl mx-auto">
              No more guessing, ignoring, or paying for translation services. Understand exactly what you need to do in three simple steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 text-center">
            <div className="p-8 rounded-3xl bg-white border border-slate-100 shadow-sm">
              <div className="w-14 h-14 bg-slate-900 text-white rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold">1</div>
              <h3 className="text-2xl font-bold mb-4">Capture Any Document</h3>
              <p className="text-slate-600 leading-relaxed">Open the Ahani app and point your camera at any physical page or digital screen that needs clarifying.</p>
            </div>
            <div className="p-8 rounded-3xl bg-white border border-slate-100 shadow-sm">
              <div className="w-14 h-14 bg-slate-900 text-white rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold">2</div>
              <h3 className="text-2xl font-bold mb-4">Read & Listen</h3>
              <p className="text-slate-600 leading-relaxed">Instantly view the translated text, or play the audio guide to hear a plain-language breakdown of exactly what the document means.</p>
            </div>
            <div className="p-8 rounded-3xl bg-white border border-slate-100 shadow-sm">
              <div className="w-14 h-14 bg-slate-900 text-white rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold">3</div>
              <h3 className="text-2xl font-bold mb-4">Chat for Confidence</h3>
              <p className="text-slate-600 leading-relaxed">Still unsure about a specific detail? Ask follow-up questions in your own language to get the exact answers you need.</p>
            </div>
          </div>
          
        </div>
      </main>

      {/* Persistent Footer */}
      <footer className="w-full bg-slate-900 text-white py-6 px-8 border-t border-slate-800 mt-auto">
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