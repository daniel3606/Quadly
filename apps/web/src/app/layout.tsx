import type { Metadata } from 'next';
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
      <body>
        <ErrorBoundary>
          <ThemeProvider>
            <ApiProvider>{children}</ApiProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
