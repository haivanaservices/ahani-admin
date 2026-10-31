import { NextResponse } from 'next/server';
import { createClient } from '../../../utils/supabase/server'; 

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  
  // This grabs "?next=/update-password" from the link, or defaults to "/dashboard"
  const next = requestUrl.searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      console.error("Auth callback error:", error.message);
      return NextResponse.redirect(new URL('/login?error=Invalid or expired link', request.url));
    }
  }

  // Redirects the user exactly where they are supposed to go
  return NextResponse.redirect(new URL(next, request.url));
}