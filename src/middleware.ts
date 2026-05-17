import { NextRequest, NextResponse } from 'next/server';

export const config = {
  matcher: ['/((?!api/health|_next/static|_next/image|favicon.ico).*)'],
};

export function middleware(request: NextRequest) {
  const password = process.env.AUTH_PASSWORD;

  // Skip auth if no password is set
  if (!password) {
    return NextResponse.next();
  }

  // Check cookie first
  const authCookie = request.cookies.get('nas-auth')?.value;
  if (authCookie === password) {
    return NextResponse.next();
  }

  // Check Basic Auth header
  const authHeader = request.headers.get('authorization');
  if (authHeader) {
    const [scheme, encoded] = authHeader.split(' ');
    if (scheme === 'Basic') {
      const decoded = atob(encoded);
      const [, pass] = decoded.split(':');
      if (pass === password) {
        const response = NextResponse.next();
        response.cookies.set('nas-auth', password, {
          httpOnly: true,
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7, // 7 days
          path: '/',
        });
        return response;
      }
    }
  }

  // Return 401 with WWW-Authenticate header
  return new NextResponse('Unauthorized', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="NAS File Manager"',
    },
  });
}
