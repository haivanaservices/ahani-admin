import Link from 'next/link';
import Image from 'next/image';
import { resetPassword } from '../actions';

export const dynamic = 'force-dynamic';

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const resolvedParams = await searchParams;

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col font-sans text-slate-900">
      
      {/* Persistent Top Menu Bar */}
      <header className="w-full px-8 py-5 bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-100 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition">
          <Image alt="Ahani Logo" className="rounded-full" height={40} src="/image_4fbdd3.png" width={40} />
          <span className="text-2xl font-bold tracking-tight text-slate-800">Ahani</span>
        </Link>
        <nav className="hidden md:flex gap-6 items-center font-medium text-sm lg:text-base">
          <Link className="text-slate-900 font-bold hover:text-slate-600 transition" href="/login">Return to Login</Link>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
          <h2 className="text-center text-3xl font-extrabold tracking-tight text-slate-900">
            Reset Password
          </h2>
          <p className="mt-2 text-center text-base text-slate-600 font-medium">
            Enter your email to receive a reset link.
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow-sm border border-slate-100 sm:rounded-2xl sm:px-10">
            
            {resolvedParams.error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm text-center font-medium">
                {resolvedParams.error}
              </div>
            )}
            
            {resolvedParams.message && (
              <div className="mb-4 p-3 bg-green-50 text-green-700 border border-green-200 rounded-lg text-sm text-center font-medium">
                {resolvedParams.message}
              </div>
            )}

            <form className="space-y-6" action={resetPassword}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                  Email Address
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="appearance-none block w-full px-4 py-3 border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-slate-900 focus:border-slate-900 sm:text-sm"
                    placeholder="name@example.com"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 transition"
                >
                  Send Reset Link
                </button>
              </div>
            </form>

            <div className="mt-6 text-center">
              <Link href="/login" className="text-sm font-medium text-blue-600 hover:text-blue-500">
                Back to Sign In
              </Link>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}