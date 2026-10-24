import type { Metadata, Viewport } from 'next';
import { Almarai, Karla, Noto_Naskh_Arabic } from 'next/font/google';
import type { ReactNode } from 'react';
import { AuthProvider } from '@/lib/auth';
import { ToastProvider } from '@/components/ui/Toast';
import './globals.css';

// Headings, in both scripts.
const naskh = Noto_Naskh_Arabic({
  subsets: ['arabic'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-naskh',
  display: 'swap',
});

// Body and UI.
const almarai = Almarai({
  subsets: ['arabic'],
  weight: ['300', '400', '700'],
  variable: '--font-almarai',
  display: 'swap',
});

// Numerals, and the small uppercase Latin labels.
const karla = Karla({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-karla',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'WizzTrain — منصة التدريب الشخصي',
  description: 'برنامجك التدريبي وخطتك الغذائية ومتابعة تقدمك اليومي',
};

export const viewport: Viewport = {
  themeColor: '#fffaf0',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${naskh.variable} ${almarai.variable} ${karla.variable}`}
    >
      <body>
        <AuthProvider>
          <ToastProvider>{children}</ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
