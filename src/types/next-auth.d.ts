import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: 'admin' | 'salesperson';
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role: 'admin' | 'salesperson';
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: 'admin' | 'salesperson';
  }
}
