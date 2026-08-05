import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;

  // Admin bilgileri tanımlı değilse hata ver
  if (!username || !password) {
    return new NextResponse(
      'ADMIN_USERNAME ve ADMIN_PASSWORD ortam değişkenleri tanımlı değil.',
      { status: 500 }
    );
  }

  const authHeader = request.headers.get('authorization');

  if (authHeader && authHeader.startsWith('Basic ')) {
    try {
      const base64Credentials = authHeader.split(' ')[1];
      const credentials = atob(base64Credentials);
      const [user, pass] = credentials.split(':');

      if (user === username && pass === password) {
        return NextResponse.next();
      }
    } catch (err) {
      console.error('Basic Auth hatası:', err);
    }
  }

  return new NextResponse('Giriş gerekli', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Admin Panel"',
    },
  });
}

// ⚠️ SADECE /admin sayfalarını koru.
// API endpoint'lerini koruma!
export const config = {
  matcher: ['/admin/:path*'],
};
