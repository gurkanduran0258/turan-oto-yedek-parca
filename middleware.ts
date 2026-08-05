import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;

  if (!username || !password) {
    return new NextResponse(
      'ADMIN_USERNAME ve ADMIN_PASSWORD Vercel ortam değişkenlerine eklenmeli.',
      { status: 503 }
    );
  }

  const auth = request.headers.get('authorization');

  if (auth?.startsWith('Basic ')) {
    try {
      const decoded = atob(auth.slice(6));
      const separator = decoded.indexOf(':');
      const suppliedUser = decoded.slice(0, separator);
      const suppliedPass = decoded.slice(separator + 1);

      if (suppliedUser === username && suppliedPass === password) {
        return NextResponse.next();
      }
    } catch {}
  }

  return new NextResponse('Yönetim paneline giriş gerekli.', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Turan Oto Yönetim"',
    },
  });
}

export const config = {
  matcher: ['/admin/:path*'],
};
