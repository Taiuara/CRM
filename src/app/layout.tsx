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
      </body>
    </html>
  );
}
