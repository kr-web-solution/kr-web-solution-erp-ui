import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import { Providers } from '@/components/shared/Providers';
import { Toaster } from 'sonner';
import './globals.css';

// Self-hosted fonts — avoids next/font/google Docker/CI flake when Google
// returns extensionless /l/font?kit= URLs (Next 15 crash: reading '1' of null).
const plusJakartaSans = localFont({
  src: [
    {
      path: './fonts/plus-jakarta-sans-latin.woff2',
      weight: '500 800',
      style: 'normal',
    },
  ],
  variable: '--font-heading',
  display: 'swap',
});

const inter = localFont({
  src: [
    {
      path: './fonts/inter-latin.woff2',
      weight: '400 700',
      style: 'normal',
    },
  ],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'KR Workspace — Internal ERP · CRM',
  description: 'Enterprise ERP and CRM for KR Web Solution, Salem HQ.',
  icons: {
    icon: '/brand/krws-mark.png',
    shortcut: '/brand/krws-mark.png',
    apple: '/brand/krws-mark.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: '#F6F7F9',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${plusJakartaSans.variable} ${inter.variable}`}>
      <body className="antialiased font-sans bg-[#F6F7F9] text-[#0F172A] selection:bg-[#FFF1F0] selection:text-[#E32B2B]">
        <Providers>
          {children}
          <Toaster
            position="top-right"
            richColors
            closeButton
            toastOptions={{
              style: {
                borderRadius: '12px',
                border: '1px solid #E6E8EE',
                boxShadow: '0 4px 16px rgba(16,24,40,.06)',
                fontFamily: 'var(--font-sans)',
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
