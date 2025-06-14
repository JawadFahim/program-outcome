import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import * as jose from 'jose';

// This secret should be in an environment variable
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'a-secure-and-long-secret-key-for-testing');

export async function middleware(request: NextRequest) {
    const tokenCookie = request.cookies.get('auth_token');
    const token = tokenCookie?.value;
    
    const { pathname } = request.nextUrl;
    
    const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/forgot-password');

    // If there's no token and the user is trying to access a protected page
    if (!token && !isAuthPage) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        return NextResponse.redirect(url);
    }
    
    // If there is a token, verify it
    if (token) {
        try {
            await jose.jwtVerify(token, JWT_SECRET);
            
            // If token is valid and user tries to access an auth page, redirect to homepage
            if (isAuthPage) {
                const url = request.nextUrl.clone();
                url.pathname = '/homepage';
                return NextResponse.redirect(url);
            }
        } catch (error) {
            // If token verification fails and it's a protected page, redirect to login
            if (!isAuthPage) {
                const url = request.nextUrl.clone();
                url.pathname = '/login';
                
                // Also, clear the invalid cookie
                const response = NextResponse.redirect(url);
                response.cookies.delete('auth_token');
                return response;
            }
        }
    }

    return NextResponse.next();
}

export const config = {
    // Matcher to specify which routes the middleware should run on.
    // This protects all pages except for API routes, static files, and image optimization files.
    matcher: [
      '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
}; 