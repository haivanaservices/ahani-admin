import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans text-slate-900 py-20 px-6">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="text-sm font-medium text-slate-500 hover:text-slate-900 mb-12 inline-block">&larr; Back to Home</Link>
        
        <h1 className="text-4xl font-extrabold tracking-tight mb-8">Privacy Policy</h1>
        <div className="prose prose-slate prose-lg text-slate-600 leading-relaxed space-y-6">
          <p>Last updated: August 2026</p>
          <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">1. Data Security</h2>
          <p>Your privacy is our primary concern. Any documents you scan are processed securely for translation purposes and are not sold to third parties.</p>
          
          <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">2. Information Collection</h2>
          <p>We collect basic account information for subscription management and usage metrics to improve our translation models.</p>
          
          <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">3. Contact</h2>
          <p>If you have any questions regarding how your data is handled, please reach out to our support team.</p>
        </div>
      </div>
    </div>
  );
}