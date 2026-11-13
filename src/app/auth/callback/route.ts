import { NextResponse } from 'next/server';
import { createClient } from '../../../utils/supabase/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);

  const code = requestUrl.searchParams.get('code');
  const token_hash = requestUrl.searchParams.get('token_hash');
  const type = requestUrl.searchParams.get('type') as any;
  const next = requestUrl.searchParams.get('next') ?? '/dashboard';

  try {
    const supabase = await createClient();

    // FLOW 1: Token Hash (Cross-browser safe - No PKCE cookie needed)
    if (token_hash && type) {
      const { error } = await supabase.auth.verifyOtp({
        token_hash,
        type,
      });

      if (!error) {
        if (type === 'invite' || type === 'recovery') {
          return NextResponse.redirect(new URL('/update-password', request.url));
        }
        return NextResponse.redirect(new URL(next, request.url));
      }
      console.error('Token Hash error:', error.message);
    }

    // FLOW 2: Legacy Code Exchange (Fallback)
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (!error) {
        if (type === 'invite' || type === 'recovery') {
          return NextResponse.redirect(new URL('/update-password', request.url));
        }
        return NextResponse.redirect(new URL(next, request.url));
      }
      console.error('Code exchange error:', error.message);
    }
  } catch (err) {
    console.error('Unexpected auth callback error:', err);
  }

  return NextResponse.redirect(
    new URL('/login?error=Invalid+or+expired+link', request.url)
  );
}