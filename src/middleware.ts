import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET_KEY = new TextEncoder().encode(
  process.env.SESSION_SECRET || 'mock_super_secret_session_key_min_32_characters_long_12345'
);

const COOKIE_NAME = 'annam_resort_session';

interface SessionPayload {
  id: string;
  email: string;
  fullName: string;
  role: 'CUSTOMER' | 'RECEPTIONIST' | 'DRIVER' | 'DISPATCHER' | 'ADMIN';
}

async function getSessionFromRequest(req: NextRequest): Promise<SessionPayload | null> {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Identify required roles for protected routes
  let requiredRoles: string[] | null = null;

  if (pathname.startsWith('/admin')) {
    requiredRoles = ['ADMIN'];
  } else if (pathname.startsWith('/reception')) {
    requiredRoles = ['RECEPTIONIST', 'ADMIN'];
  } else if (pathname.startsWith('/transport/dispatch')) {
    requiredRoles = ['DISPATCHER', 'ADMIN'];
  } else if (pathname.startsWith('/transport/driver')) {
    requiredRoles = ['DRIVER', 'ADMIN'];
  }

  // Route does not require role restriction
  if (!requiredRoles) {
    return NextResponse.next();
  }

  // 2. Verify Session
  const session = await getSessionFromRequest(req);

  // Unauthenticated user -> Redirect to /login with return destination
  if (!session) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 3. Verify Role Authorization
  if (!requiredRoles.includes(session.role)) {
    const unauthorizedUrl = new URL('/unauthorized', req.url);
    unauthorizedUrl.searchParams.set('currentRole', session.role);
    unauthorizedUrl.searchParams.set('requiredRoles', requiredRoles.join(', '));
    unauthorizedUrl.searchParams.set('path', pathname);
    return NextResponse.redirect(unauthorizedUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin',
    '/admin/:path*',
    '/reception',
    '/reception/:path*',
    '/transport/dispatch',
    '/transport/dispatch/:path*',
    '/transport/driver',
    '/transport/driver/:path*',
  ],
};

