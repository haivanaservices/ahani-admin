import Image from 'next/image';
import Link from 'next/link';

export default function TermsPage() {
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
          
          <h1 className="text-4xl font-extrabold tracking-tight mb-8">Terms and Conditions</h1>
          
          <div className="prose prose-slate prose-lg text-slate-600 leading-relaxed space-y-8">
            <p className="font-medium text-slate-500">Effective as of: August 2026</p>
            
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">1. Agreement between User and Ahani</h2>
              <p>
                Welcome to ahani.com. The ahani.com website and mobile applications (collectively, the "Site" or "Platform") are operated by Ahani. The Platform is offered to you conditioned on your acceptance without modification of the terms, conditions, and notices contained herein (the "Terms"). Your use of the Platform constitutes your agreement to all such Terms.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">2. Description of Service & Limitation of Liability</h2>
              <p className="mb-4">
                Ahani provides a digital platform and AI-assisted tools that allow users to scan, translate, and receive plain-language summaries of complex documents. 
              </p>
              <div className="bg-amber-50 border border-amber-200 p-6 rounded-xl my-6">
                <h3 className="text-lg font-bold text-amber-900 mb-2">Legal and Medical Disclaimer</h3>
                <p className="text-amber-800 text-base m-0">
                  Ahani is a technology company, not a law firm, medical provider, or certified human translation service. While our AI strives for high accuracy, the translations and explanations provided are meant as a guide and should <strong>never</strong> substitute official legal, financial, or medical counsel. Ahani does not guarantee absolute accuracy and assumes no liability for the outcome of any actions taken (or not taken) based on the translated content.
                </p>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">3. User Obligations and Accuracy</h2>
              <p>
                Users attest to the truth and accuracy of the information they provide to Ahani. Enterprise users (agencies and organizations) are strictly obliged to meet all legal requirements regarding Title VI compliance and document accessibility. Users must maintain their own accounts securely; transfer of enterprise account privileges is strictly prohibited and will result in immediate suspension.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">4. Electronic & SMS Communications</h2>
              <p>
                Visiting the Site, sending emails, or submitting forms to Ahani constitutes electronic communications. By providing your phone number and opting in, you explicitly consent to receive electronic communications, including SMS text messages, regarding account status, platform alerts, and subscription updates. You may opt-out of SMS messages at any time by replying STOP.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">5. App Store & Platform Guidelines</h2>
              <p>
                You agree to use the Platform strictly in accordance with these Terms. You may not use the Site in any manner which could damage, disable, or impair the Platform. You may not post, upload, or distribute any inappropriate, profane, defamatory, infringing, obscene, or unlawful material. Ahani reserves the right to review materials and to terminate user access in its sole discretion without notice.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">6. Cancellation & Refund Policy</h2>
              <p>
                <strong>Private Mobile Users:</strong> Subscriptions purchased through the Ahani mobile app are managed entirely by the Apple App Store or Google Play Store. Cancellations and refund requests must be handled through your respective device's subscription settings. 
              </p>
              <p className="mt-2">
                <strong>Enterprise Accounts:</strong> Agency billing is governed by your specific Purchase Order (PO) or vendor contract. Cancellation requests must be submitted directly to your Ahani account representative prior to the next billing cycle.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">7. Arbitration & Class Action Waiver</h2>
              <p>
                In the event the parties are not able to resolve any dispute arising out of or concerning these Terms, such dispute shall be resolved only by final and binding arbitration pursuant to the Federal Arbitration Act, conducted by a single neutral arbitrator and administered by the American Arbitration Association.
              </p>
              <p className="mt-2 font-bold uppercase text-sm text-slate-500">
                Any arbitration will take place on an individual basis; class arbitrations and class/representative/collective actions are not permitted. The parties agree that a party may bring claims against the other only in each's individual capacity, and not as a plaintiff or class member in any putative class.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">8. Liability Disclaimer & Indemnification</h2>
              <p className="uppercase text-sm font-bold text-slate-500 mb-4">
                The information, software, products, and services included in or available through the site are provided "as is" without warranty or condition of any kind. To the maximum extent permitted by applicable law, in no event shall Ahani be liable for any direct, indirect, punitive, incidental, special, or consequential damages arising out of or in any way connected with the use of the site or the translations provided.
              </p>
              <p>
                You agree to indemnify, defend, and hold harmless Ahani, its officers, directors, employees, and agents for any losses, costs, liabilities, and expenses relating to or arising out of your use of the Site, your violation of these Terms, or your violation of any rights of a third party, including damages arising from actions taken based on translated documents.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">9. Contact Us</h2>
              <p>
                Ahani welcomes your questions or comments regarding the Terms:
              </p>
              <p className="mt-2 font-medium">
                Email: info@ahani.com
              </p>
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