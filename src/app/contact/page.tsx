import Link from 'next/link';
import { submitContactForm } from '../actions';

export default function ContactPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const isSuccess = searchParams.status === 'success';

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans text-slate-900">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl flex flex-col items-center">
        <Link href="/" className="text-sm font-medium text-slate-500 hover:text-slate-900 mb-6">&larr; Back to Home</Link>
        <h2 className="text-center text-4xl font-extrabold tracking-tight">Contact Ahani</h2>
        <p className="mt-2 text-center text-slate-500 px-4 max-w-lg">
          Have questions about empowering your community, patients, or clients? Fill out the form below and our team will be in touch.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white py-10 px-6 shadow-sm border border-slate-100 sm:rounded-2xl sm:px-12">
          
          {isSuccess ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">✓</div>
              <h3 className="text-2xl font-bold mb-2">Message Received</h3>
              <p className="text-slate-600 mb-6">Thank you for reaching out! A member of the Ahani team will contact you shortly.</p>
              <Link href="/" className="text-slate-900 font-semibold hover:underline">Return to Homepage</Link>
            </div>
          ) : (
            <form className="space-y-6" action={submitContactForm}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-slate-700">First Name</label>
                  <input type="text" id="firstName" name="firstName" required className="mt-1 block w-full px-4 py-3 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-slate-900 focus:border-slate-900" />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-slate-700">Last Name</label>
                  <input type="text" id="lastName" name="lastName" required className="mt-1 block w-full px-4 py-3 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-slate-900 focus:border-slate-900" />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700">Email Address</label>
                <input type="email" id="email" name="email" required className="mt-1 block w-full px-4 py-3 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-slate-900 focus:border-slate-900" />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-slate-700">Phone Number</label>
                <input type="tel" id="phone" name="phone" className="mt-1 block w-full px-4 py-3 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-slate-900 focus:border-slate-900" />
              </div>

              <div>
                <label htmlFor="agencyName" className="block text-sm font-medium text-slate-700">Company / Organization Name</label>
                <input type="text" id="agencyName" name="agencyName" required className="mt-1 block w-full px-4 py-3 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-slate-900 focus:border-slate-900" />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-slate-700">How can we help you?</label>
                <textarea id="message" name="message" rows={4} required placeholder="Please describe why you are contacting us..." className="mt-1 block w-full px-4 py-3 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-slate-900 focus:border-slate-900"></textarea>
              </div>

              <button type="submit" className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 transition">
                Submit Inquiry
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}