import Image from 'next/image';
import Link from 'next/link';

export default function AgenciesPage() {
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
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
              Empower Your Community. <br/>Close the Communication Gap.
            </h1>
            <p className="text-xl text-slate-500 max-w-3xl mx-auto leading-relaxed">
              When medical bills, legal notices, insurance forms, and tax documents are sent only in English, a massive portion of your community is left in the dark. Ahani allows you to bridge that gap without overhauling your entire mail infrastructure.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-20 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-4">Reduce Call Center Volume & Confusion</h2>
              <p className="text-slate-600 leading-relaxed mb-6">
                Unanswered notices often result in missed deadlines, compounded fees, and panicked phone calls to your organization's support staff. By equipping your outbound mailers with Ahani QR codes, you empower patients, clients, and residents to understand your forms independently. They receive instant, plain-language explanations in their native language directly on their mobile device.
              </p>
              <ul className="space-y-3 text-slate-600">
                <li className="flex items-center gap-3">
                  <span className="text-green-600">✓</span> Perfect for Hospitals, Law Firms, and Government.
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-green-600">✓</span> Instant deployment on existing English mailers.
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-green-600">✓</span> Enhances compliance and language access requirements.
                </li>
              </ul>
            </div>
            <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
              <h3 className="font-bold text-xl mb-6 text-center">How It Works for Organizations</h3>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold shrink-0">1</div>
                  <p className="text-sm text-slate-600"><strong className="text-slate-900 block mb-1">Generate QR Codes</strong> Log into your dashboard and generate unique campaign codes. Print these directly onto your standard mailers, or create posters to display around your office for on-site scanning.</p>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold shrink-0">2</div>
                  <p className="text-sm text-slate-600"><strong className="text-slate-900 block mb-1">Users Scan</strong> Recipients scan the code with their smartphone. Using our AI document fingerprinting, the system instantly identifies your specific form and delivers a secure, translated summary in their native language.</p>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold shrink-0">3</div>
                  <p className="text-sm text-slate-600"><strong className="text-slate-900 block mb-1">Track Impact</strong> View aggregated, anonymized metrics to see exactly which languages are most requested, proving ROI while maintaining strict user privacy.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 text-white rounded-3xl p-10 md:p-16 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to pilot Ahani in your organization?</h2>
            <p className="text-slate-400 mb-8 max-w-2xl mx-auto">Set up your administrative portal today and start empowering your patients, clients, and constituents.</p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/signup" className="bg-white text-slate-900 px-8 py-4 rounded-xl font-semibold hover:bg-slate-100 transition inline-block">
                Create Enterprise Account
              </Link>
              <Link href="/contact" className="bg-transparent border border-slate-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-slate-800 transition inline-block">
                Talk to Sales
              </Link>
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