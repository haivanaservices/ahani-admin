import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// Notice this is now called "proxy" instead of "middleware"!
export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, 
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // THE VIP LIST: These exact routes are fully public and will not redirect to /login
  const publicRoutes = ['/', '/login', '/agency-signup', '/about', '/agencies', '/contact', '/privacy', '/terms'];
  
  const isPublicRoute = publicRoutes.some(route => request.nextUrl.pathname === route);
  const isAssetOrApi = request.nextUrl.pathname.startsWith('/_next') || request.nextUrl.pathname.startsWith('/api');

  // If they are NOT logged in, and NOT on a public route or loading an asset, bounce them to login
  if (!user && !isPublicRoute && !isAssetOrApi) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};