import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PingDesk CRM - Sistema de Gestão de Vendas",
  description: "Sistema CRM completo para gestão de propostas, agenda e leads",
  icons: {
    icon: [
      { url: "/favicon.svg?v=" + Date.now(), type: "image/svg+xml" },
      { url: "/favicon-32x32.png?v=" + Date.now(), sizes: "32x32" },
      { url: "/favicon-16x16.png?v=" + Date.now(), sizes: "16x16" },
    ],
    shortcut: "/favicon.svg?v=" + Date.now(),
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="icon" type="image/svg+xml" href={`/favicon.svg?v=${Date.now()}`} />
        <link rel="alternate icon" href={`/favicon-32x32.png?v=${Date.now()}`} />
        <link rel="shortcut icon" href={`/favicon.svg?v=${Date.now()}`} />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#3b82f6" />
      </head>
      <body className={`${inter.className} antialiased`}>
        <AuthProvider>
          {children}
        </AuthProvider>
        {/* Sistema de backup automático para Vercel */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Verificar se está no Vercel e inicializar backup
              if (window.location.hostname.includes('.vercel.app')) {
                console.log('🔄 Vercel detectado - Sistema de backup ativo');
                
                // Inicializar admin se não existir
                const adminUser = {
                  id: '1',
                  name: 'Administrador',
                  email: 'admin@pingdesk.com',
                  password: '$2a$10$vI7eKfP8DZKfB7tHwY8qE.8FjLlnZI9qS6JOb7Y3dNjVzGX0dP4B2',
                  role: 'admin',
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString()
                };
                
                if (!localStorage.getItem('crm-users')) {
                  localStorage.setItem('crm-users', JSON.stringify([adminUser]));
                  console.log('👤 Admin inicializado no backup');
                }
                
                // Interceptar fetch para backup automático
                const originalFetch = window.fetch;
                window.fetch = async function(input, init) {
                  try {
                    const response = await originalFetch(input, init);
                    const url = typeof input === 'string' ? input : input.toString();
                    
                    // Fazer backup dos dados automaticamente
                    if (response.ok && url.includes('/api/')) {
                      const data = await response.clone().json();
                      
                      if (url.includes('/users') && Array.isArray(data)) {
                        localStorage.setItem('crm-users', JSON.stringify(data));
                      } else if (url.includes('/meetings') && Array.isArray(data)) {
                        localStorage.setItem('crm-meetings', JSON.stringify(data));
                      } else if (url.includes('/proposals') && Array.isArray(data)) {
                        localStorage.setItem('crm-proposals', JSON.stringify(data));
                      } else if (url.includes('/leads') && Array.isArray(data)) {
                        localStorage.setItem('crm-leads', JSON.stringify(data));
                      }
                    }
                    
                    return response;
                  } catch (error) {
                    console.error('Fetch error:', error);
                    
                    // Se API falhar, tentar usar backup
                    const url = typeof input === 'string' ? input : input.toString();
                    if (init?.method === 'GET' || !init?.method) {
                      let backup = null;
                      if (url.includes('/users')) backup = localStorage.getItem('crm-users');
                      if (url.includes('/meetings')) backup = localStorage.getItem('crm-meetings');
                      if (url.includes('/proposals')) backup = localStorage.getItem('crm-proposals');
                      if (url.includes('/leads')) backup = localStorage.getItem('crm-leads');
                      
                      if (backup) {
                        console.log('🔄 Usando backup para:', url);
                        return new Response(backup, { status: 200, headers: { 'Content-Type': 'application/json' } });
                      }
                    }
                    
                    throw error;
                  }
                };
                
                console.log('✅ Sistema de backup CRM ativo!');
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
