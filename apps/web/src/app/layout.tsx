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
              <footer className="border-t border-gray-200 dark:border-gray-700 py-4 px-6 text-center text-sm text-gray-500 dark:text-gray-400">
                <Link
                  href="/terms"
                  className="hover:text-gray-900 dark:hover:text-white underline"
                >
                  Terms of Service
                </Link>
                {' · '}
                <Link
                  href="/privacy"
                  className="hover:text-gray-900 dark:hover:text-white underline"
                >
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
