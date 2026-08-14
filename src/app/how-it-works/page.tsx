import Link from 'next/link';
import Image from 'next/image';

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] text-slate-900 font-sans py-20 px-6">
      <div className="max-w-5xl mx-auto">
        <Link href="/" className="text-sm font-medium text-slate-500 hover:text-slate-900 mb-12 inline-block">&larr; Back to Home</Link>
        
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

        <div className="mt-20 text-center">
          <Link href="/subscribe" className="bg-slate-900 text-white px-8 py-4 rounded-xl font-bold hover:bg-slate-800 transition shadow-lg text-lg inline-block">
            Get Started Today
          </Link>
        </div>
      </div>
    </div>
  );
}