import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyJwt } from './lib/jwt';

const redirectToLogin = (request: NextRequest, path: string) => {
    const url = request.nextUrl.clone();
    url.pathname = path;
    const response = NextResponse.redirect(url);
    // Clear both cookies on redirect to login
    response.cookies.delete('auth_token');
    response.cookies.delete('admin_auth_token');
    return response;
};

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    const teacherToken = request.cookies.get('auth_token')?.value;
    const adminToken = request.cookies.get('admin_auth_token')?.value;

    const isTeacherPath = !pathname.startsWith('/admin');
    const isAdminPath = pathname.startsWith('/admin');

    // Handle Teacher Routes
    if (isTeacherPath) {
        const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/forgot-password');
        if (teacherToken) {
            const payload = await verifyJwt(teacherToken);
            if (payload && payload.role !== 'admin') {
                if (isAuthPage) {
                    const url = request.nextUrl.clone();
                    url.pathname = '/homepage';
                    return NextResponse.redirect(url);
                }
                return NextResponse.next();
            }
        }
        if (!isAuthPage) {
            return redirectToLogin(request, '/login');
        }
    }

    // Handle Admin Routes
    if (isAdminPath) {
        const isAdminLoginPage = pathname.startsWith('/admin/login');
        if (adminToken) {
            const payload = await verifyJwt(adminToken);
            if (payload && payload.role === 'admin') {
                if (isAdminLoginPage) {
                    const url = request.nextUrl.clone();
                    url.pathname = '/admin/homepage';
                    return NextResponse.redirect(url);
                }
                return NextResponse.next();
            }
        }
        if (!isAdminLoginPage) {
            return redirectToLogin(request, '/admin/login');
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
      /*
       * Match all request paths except for the ones starting with:
       * - api (API routes)
       * - _next/static (static files)
       * - _next/image (image optimization files)
       * - favicon.ico (favicon file)
       */
      '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
}; 