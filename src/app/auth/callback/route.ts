import { NextResponse } from 'next/server';
import { createClient } from '../../../utils/supabase/server'; 

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  
  // Grab variables from the URL
  const code = requestUrl.searchParams.get('code');
  const token_hash = requestUrl.searchParams.get('token_hash');
  const type = requestUrl.searchParams.get('type') as any;
  const next = requestUrl.searchParams.get('next') ?? '/dashboard';

  const supabase = await createClient();

  // FLOW 1: Token Hash (Cross-browser safe - No PKCE cookie needed)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type,
    });
    
    if (!error) {
      // FIX: If this is a team member invitation or password recovery, 
      // route them to the password setup screen before letting them into the dashboard.
      if (type === 'invite' || type === 'recovery') {
        return NextResponse.redirect(new URL('/auth/update-password', request.url));
      }
      return NextResponse.redirect(new URL(next, request.url));
    } else {
      console.error("Token Hash error:", error.message);
    }
  }

  // FLOW 2: Legacy Code Exchange (Fallback)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      if (type === 'invite' || type === 'recovery') {
        return NextResponse.redirect(new URL('/auth/update-password', request.url));
      }
      return NextResponse.redirect(new URL(next, request.url));
    } else {
      console.error("Code exchange error:", error.message);
    }
  }

  // If both methods fail, kick them back to login
  return NextResponse.redirect(new URL('/login?error=Invalid or expired link', request.url));
}