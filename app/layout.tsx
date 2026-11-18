import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import { Providers } from '@/components/shared/Providers';
import { Toaster } from 'sonner';
import './globals.css';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
  weight: ['500', '600', '700', '800'],
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
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
