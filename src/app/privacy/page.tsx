import Image from 'next/image';
import Link from 'next/link';

export default function PrivacyPage() {
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
          
          <h1 className="text-4xl font-extrabold tracking-tight mb-8">Privacy Policy</h1>
          
          <div className="prose prose-slate prose-lg text-slate-600 leading-relaxed space-y-8">
            <p className="font-medium text-slate-500">Effective as of: August 2026</p>
            
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">1. Introduction</h2>
              <p>
                Protecting your private information is our priority. This Statement of Privacy applies to ahani.com, the Ahani mobile applications, and Ahani as an entity, governing data collection and usage. By using the Ahani platform, you consent to the data practices described in this statement.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">2. Collection of your Personal Information</h2>
              <p className="mb-4">
                To better provide you with our services, Ahani may collect basic personally identifiable information when you voluntarily register for an account or communicate with us, such as your Name, E-mail Address, and Phone Number. If you purchase Ahani's products or services, we collect billing and credit card information to complete the transaction. 
              </p>
              <div className="bg-green-50 border border-green-200 p-6 rounded-xl my-6">
                <h3 className="text-lg font-bold text-green-900 mb-2 flex items-center gap-2">
                  <span className="text-2xl">🛡️</span> Zero Document Retention Guarantee
                </h3>
                <p className="text-green-800 text-base m-0">
                  <strong>We do not save your documents.</strong> Ahani strictly does not store, log, or retain images of the physical documents you scan. Furthermore, we do not extract, store, or log any sensitive Personally Identifiable Information (PII), such as medical records, social security numbers, or financial data contained within those documents. The AI processes the text in real-time for immediate translation and instantly discards the source data.
                </p>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">3. Use of your Personal Information</h2>
              <p>
                Ahani collects and uses your personal information to operate its website and deliver the services you have requested, specifically to:
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-2">
                <li>Manage your enterprise or personal subscription accounts.</li>
                <li>Provide real-time, zero-PII AI translation services and follow-up answers.</li>
                <li>Send critical lifecycle updates and customer support communications.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">4. Strict Mobile Data & Third-Party Sharing Policy</h2>
              <p>
                Ahani does not sell, rent, or lease its customer lists to third parties. Furthermore, no mobile information or SMS opt-in data will be shared with any third parties or affiliates for marketing or promotional purposes. All text messaging originator opt-in data and consent is strictly confidential.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">5. Automatically Collected Information & Cookies</h2>
              <p>
                Information about your computer hardware and software may be automatically collected by Ahani, including your IP address, browser type, and access times. This is used for the operation of the service and to maintain quality. The Site uses "cookies" to help personalize your online experience. You have the ability to accept or decline cookies via your browser settings.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">6. Right to Deletion (App Store Compliance)</h2>
              <p>
                Subject to certain exceptions set out below, on receipt of a verifiable request from you, we will:
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-2">
                <li>Delete your personal information from our records.</li>
                <li>Direct any service providers to delete your personal information from their records.</li>
              </ul>
              <p className="mt-2">
                Please note we may not be able to comply if the data is necessary to complete a transaction, detect security incidents, debug errors, or comply with existing legal obligations.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">7. E-mail Communications & Opt-Out</h2>
              <p>
                Ahani may contact you via email for the purpose of providing announcements, alerts, and confirmations. If you would like to stop receiving marketing or promotional communications via email from Ahani, you may opt out by clicking the "Unsubscribe" link at the bottom of any email.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">8. Security of your Personal Information</h2>
              <p>
                Ahani secures your personal information from unauthorized access, use, or disclosure using SSL protocols. While we strive to protect your personal information, no data transmission over the Internet can be guaranteed to be 100% secure. You acknowledge that security limitations inherent to the Internet are beyond our control.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">9. Contact Information</h2>
              <p>
                Ahani welcomes your questions or comments regarding this Statement of Privacy. Please contact us at:
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