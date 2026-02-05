import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Block access to signup/register page
    if (pathname.startsWith('/auth/register')) {
        return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    // Only protect /dashboard routes
    if (pathname.startsWith('/dashboard')) {
        // Check for better-auth session cookie
        const sessionToken = request.cookies.get('better-auth.session_token');

        if (!sessionToken) {
            // Redirect to login if no session
            return NextResponse.redirect(new URL('/auth/login', request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/dashboard/:path*', '/auth/register/:path*'],
};
