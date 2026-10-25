import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import { IBM_Plex_Sans_Arabic } from 'next/font/google';
import type { ReactNode } from 'react';
import { AuthProvider } from '@/lib/auth';
import { ToastProvider } from '@/components/ui/Toast';
import './globals.css';

/**
 * Brando Arabic — the Let's Ops primary typeface, self-hosted from the brand
 * files. Five of the eight shipped weights are wired up; the hairline and
 * extra-light cuts are display weights the product has no use for.
 */
const brando = localFont({
  src: [
    { path: '../fonts/Brando-Arabic-Light.otf', weight: '300', style: 'normal' },
    { path: '../fonts/Brando-Arabic-Regular.otf', weight: '400', style: 'normal' },
    { path: '../fonts/Brando-Arabic-Text.otf', weight: '500', style: 'normal' },
    { path: '../fonts/Brando-Arabic-SemiBold.otf', weight: '600', style: 'normal' },
    { path: '../fonts/Brando-Arabic-Bold.otf', weight: '700', style: 'normal' },
    { path: '../fonts/Brando-Arabic-Black.otf', weight: '900', style: 'normal' },
  ],
  variable: '--font-brando',
  display: 'swap',
});

/**
 * The alternate the brand book approves. It carries Latin and tabular figures
 * that Brando's Arabic cuts do not, so it backs up every numeral as well as
 * standing in wherever Brando fails to load.
 */
const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-plex-arabic',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'WizzTrain — منصة التدريب الشخصي',
  description: 'برنامجك التدريبي وخطتك الغذائية ومتابعة تقدمك اليومي',
};

export const viewport: Viewport = {
  themeColor: '#00004F',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={`${brando.variable} ${plexArabic.variable}`}>
      <body>
        <AuthProvider>
          <ToastProvider>{children}</ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
