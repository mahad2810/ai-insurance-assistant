import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // Define public paths that don't require authentication
  const publicPaths = [
    '/',
    '/about',
    '/try-chat',
    '/auth/signin',
    '/auth/register',
    '/auth/error',
    '/api/auth',
    '/api/ask',
    '/api/try-chat',
    '/api/translate',
    '/api/detect-language'
  ];

  // Check if the path is public or starts with public paths
  const isPublicPath = publicPaths.some(
    publicPath =>
      path === publicPath ||
      path.startsWith(`${publicPath}/`) ||
      path.match(/\.(jpg|png|svg|ico)$/) // Static assets
  );

  // If it's a public path, allow the request
  if (isPublicPath) {
    return NextResponse.next();
  }

  // Get the session token with multiple attempts and different configurations
  let token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET
  });

  // Try alternative token retrieval methods for better mobile compatibility
  if (!token) {
    token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
      cookieName: process.env.NODE_ENV === 'production' ? '__Secure-next-auth.session-token' : 'next-auth.session-token'
    });
  }

  // Try with different secureCookie setting for mobile browsers
  if (!token) {
    token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
      secureCookie: process.env.NODE_ENV === 'production'
    });
  }

  // If there is no session and the path is not public, redirect to signin
  if (!token && !path.includes('/api/')) {
    const url = new URL('/auth/signin', req.url);
    url.searchParams.set('callbackUrl', encodeURI(req.url));
    return NextResponse.redirect(url);
  }

  // For API routes, return 401 if not authenticated
  if (!token && path.includes('/api/')) {
    return new NextResponse(
      JSON.stringify({ success: false, message: 'Authentication required' }),
      { status: 401, headers: { 'content-type': 'application/json' } }
    );
  }

  return NextResponse.next();
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all paths except for:
     * 1. /api/auth (NextAuth.js paths)
     * 2. /_next (Next.js internals)
     * 3. /fonts, /images (static assets)
     * 4. /favicon.ico, /sitemap.xml (SEO assets)
     */
    '/((?!api/auth|_next|fonts|images|favicon.ico|sitemap.xml).*)',
  ],
}; 