import Image from 'next/image';
import Link from 'next/link';

export default function AboutPage() {
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
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-extrabold tracking-tight mb-8">Our Mission</h1>
          <div className="prose prose-slate prose-lg">
            <p className="text-slate-600 leading-relaxed mb-6">
              At Ahani, we believe that language should never be a barrier to understanding your rights, your responsibilities, or your community. 
            </p>
            <p className="text-slate-600 leading-relaxed mb-6">
              Every day, millions of people receive critical mail—medical bills, legal notices, housing updates—that they cannot read. We built Ahani to transform these confusing, formal documents into plain, accessible language and spoken audio.
            </p>
            <p className="text-slate-600 leading-relaxed">
              By bridging the language gap, we are building trust, empowering individuals, and creating a more inclusive world.
            </p>
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