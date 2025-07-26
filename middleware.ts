import { withAuth } from 'next-auth/middleware';

export default withAuth(
  function middleware(req) {
    // Middleware executado após autenticação
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Permitir acesso a /login sem autenticação
        if (req.nextUrl.pathname === '/login') {
          return true;
        }
        
        // Requer token válido para outras rotas
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/proposals/:path*',
    '/leads/:path*',
    '/agenda/:path*',
    '/login',
  ],
};
