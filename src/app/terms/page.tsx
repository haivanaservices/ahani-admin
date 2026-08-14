import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans text-slate-900 py-20 px-6">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="text-sm font-medium text-slate-500 hover:text-slate-900 mb-12 inline-block">&larr; Back to Home</Link>
        
        <h1 className="text-4xl font-extrabold tracking-tight mb-8">Terms of Service</h1>
        <div className="prose prose-slate prose-lg text-slate-600 leading-relaxed space-y-6">
          <p>Last updated: August 2026</p>
          
          <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">1. Acceptance of Terms</h2>
          <p>By accessing and using Ahani, you accept and agree to be bound by the terms and provision of this agreement.</p>
          
          <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">2. Service Usage</h2>
          <p>Ahani provides translation and explanation services as a guide. We strive for high accuracy, but our translations should not substitute official legal or medical counsel.</p>
          
          <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">3. Subscriptions</h2>
          <p>Monthly and annual subscriptions are billed in advance. You may cancel at any time through your account dashboard.</p>
        </div>
      </div>
    </div>
  );
}