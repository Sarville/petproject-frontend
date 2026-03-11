import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED = ['/', '/admin', '/onboarding'];

export function proxy(request: NextRequest) {
  const token = request.cookies.get('access_token');
  const { pathname } = request.nextUrl;

  if (pathname === '/login' && token) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (PROTECTED.includes(pathname) && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/login', '/admin', '/onboarding'],
};
