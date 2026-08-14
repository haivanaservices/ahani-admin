import Link from 'next/link';

export default function SubscribePage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans text-slate-900 py-16 px-6">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="text-sm font-medium text-slate-500 hover:text-slate-900 mb-10 inline-block">&larr; Back to Home</Link>
        
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">Choose Your Plan</h1>
          <p className="text-lg text-slate-500 max-w-xl mx-auto">
            Unlock unlimited document scanning, instant audio explanations, and interactive chat in your language.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {/* Monthly Plan */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col">
            <h3 className="text-2xl font-bold mb-2">Monthly</h3>
            <p className="text-slate-500 mb-6">Perfect for short-term needs.</p>
            <div className="mb-8">
              <span className="text-5xl font-extrabold">$6.99</span>
              <span className="text-slate-500 font-medium">/month</span>
            </div>
            <ul className="space-y-4 mb-8 flex-grow">
              <li className="flex items-center gap-3 text-slate-700">
                <span className="text-green-600 font-bold">✓</span> Unlimited document translations
              </li>
              <li className="flex items-center gap-3 text-slate-700">
                <span className="text-green-600 font-bold">✓</span> Plain-language audio playback
              </li>
              <li className="flex items-center gap-3 text-slate-700">
                <span className="text-green-600 font-bold">✓</span> Ask follow-up questions
              </li>
            </ul>
            <button className="w-full bg-slate-100 text-slate-900 font-bold py-4 rounded-xl hover:bg-slate-200 transition">
              Subscribe Monthly
            </button>
          </div>

          {/* Yearly Plan (Highlighted) */}
          <div className="bg-slate-900 rounded-3xl p-8 border border-slate-900 shadow-xl flex flex-col relative text-white">
            <div className="absolute top-0 right-8 transform -translate-y-1/2 bg-green-400 text-slate-900 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
              Save 15%
            </div>
            <h3 className="text-2xl font-bold mb-2">Annually</h3>
            <p className="text-slate-400 mb-6">Best value for ongoing peace of mind.</p>
            <div className="mb-8">
              <span className="text-5xl font-extrabold">$69.99</span>
              <span className="text-slate-400 font-medium">/year</span>
            </div>
            <ul className="space-y-4 mb-8 flex-grow">
              <li className="flex items-center gap-3 text-slate-200">
                <span className="text-green-400 font-bold">✓</span> Unlimited document translations
              </li>
              <li className="flex items-center gap-3 text-slate-200">
                <span className="text-green-400 font-bold">✓</span> Plain-language audio playback
              </li>
              <li className="flex items-center gap-3 text-slate-200">
                <span className="text-green-400 font-bold">✓</span> Ask follow-up questions
              </li>
              <li className="flex items-center gap-3 text-slate-200">
                <span className="text-green-400 font-bold">✓</span> Priority support
              </li>
            </ul>
            <button className="w-full bg-white text-slate-900 font-bold py-4 rounded-xl hover:bg-slate-100 transition flex justify-center items-center gap-2">
              Subscribe Annually
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </button>
          </div>
        </div>

        <div className="mt-12 text-center text-sm text-slate-500">
          Payments are securely processed via <span className="font-semibold text-slate-700">Stripe</span>. We accept all major credit and debit cards.
        </div>
      </div>
    </div>
  );
}