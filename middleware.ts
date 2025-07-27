import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  
  // Define public paths that don't require authentication
  const publicPaths = [
    '/',
    '/auth/signin',
    '/auth/register',
    '/auth/error',
    '/api/auth'
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
  
  // Get the session token
  const token = await getToken({ req });
  
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