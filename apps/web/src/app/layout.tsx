import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ApiProvider } from '@/components/ApiProvider';

export const metadata: Metadata = {
  title: 'Quadly',
  description: 'Quadly Campus Community Platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="flex min-h-screen flex-col">
        <ErrorBoundary>
          <ThemeProvider>
            <ApiProvider>
              <div className="flex-1">{children}</div>
              <footer className="border-t border-border py-6 md:py-8 px-4 sm:px-6 lg:px-8 text-center text-sm md:text-base text-text-secondary">
                <Link href="/terms" className="hover:text-primary dark:hover:text-background underline">
                  Terms of Service
                </Link>
                {' · '}
                <Link href="/privacy" className="hover:text-primary dark:hover:text-background underline">
                  Privacy Policy
                </Link>
              </footer>
            </ApiProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
