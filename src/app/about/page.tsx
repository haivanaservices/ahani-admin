import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans text-slate-900 py-20 px-6">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="text-sm font-medium text-slate-500 hover:text-slate-900 mb-12 inline-block">&larr; Back to Home</Link>
        
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
    </div>
  );
}